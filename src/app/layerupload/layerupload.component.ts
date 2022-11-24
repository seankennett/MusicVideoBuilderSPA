import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators, FormArray, AbstractControl, ValidationErrors, ValidatorFn, FormGroup, AsyncValidatorFn } from '@angular/forms';
import { Observable, OperatorFunction, Subscription, throwError } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  map,
  filter,
  catchError
} from 'rxjs/operators';
import { Tag } from '../tag';
import { TagsService } from '../tags.service';
import { LayerUploadService } from '../layerupload.service';
import { BlockBlobClient } from "@azure/storage-blob";
import { Layerupload } from '../layerupload';
import * as JSZip from 'jszip';
import { ToastService } from '../toast.service';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

const byteMultiplier = 1024;

@Component({
  selector: 'app-layerupload',
  templateUrl: './layerupload.component.html',
  styleUrls: ['./layerupload.component.scss']
})
export class LayerUploadComponent implements OnInit {

  constructor(private formBuilder: FormBuilder, private tagsService: TagsService, private layerUploadService: LayerUploadService, private toastService: ToastService, private router: Router) { }

  ngOnInit(): void {
    this.disableEnableForm(true);
    this.getTags();
    this.layerFilesFormArray.statusChanges.subscribe(statusChange => {
      if (this.layerFilesFormArray.controls.some(control => !control.pending && control.invalid) || statusChange === 'INVALID') {
        this.imageValidationProgress = 0;
      } else if (statusChange === 'PENDING') {
        this.imageValidationProgress = this.imageValidationProgress + 100 / this.numberOfImages;
      }
      else if (statusChange === 'VALID') {
        this.imageValidationProgress = 100;
      }
    });
    this.layerType.valueChanges.subscribe(valueChange => {
      if (this.layerFilesFormArray.length > 0) {
        this.triggerValidation(this.layerFilesFormArray);
      }
    });
  }

  triggerValidation(control: AbstractControl) {
    if (control instanceof FormGroup) {
      const group = (control as FormGroup);

      for (const field in group.controls) {
        const c = group.controls[field];

        this.triggerValidation(c);
      }
    }
    else if (control instanceof FormArray) {
      const group = (control as FormArray);

      for (const field in group.controls) {
        const c = group.controls[field];

        this.triggerValidation(c);
      }
    }

    control.updateValueAndValidity({ onlySelf: false });
  }

  getTags(): void {
    this.tagsService.getTags().subscribe((tags: Tag[]) => {
      this.tags = tags;
      this.disableEnableForm(false);
    });
  }

  tags: Tag[] = []

  existingTagsFormArray = this.formBuilder.array([], [Validators.required, Validators.minLength(5), Validators.maxLength(15)])
  layerFilesFormArray = this.formBuilder.array([], [Validators.required, Validators.minLength(this.numberOfImages), Validators.maxLength(this.numberOfImages), this.maxSizeValidator()])
  layerType = this.formBuilder.control(1, [Validators.required])

  layerUploadForm = this.formBuilder.group({
    layerName: ['', [Validators.required, Validators.maxLength(50), Validators.pattern("[A-z0-9]+")]],
    layerType: this.layerType,
    existingTagInput: [null],
    existingTags: this.existingTagsFormArray,
    newTagInput: ['', [Validators.maxLength(20), Validators.pattern("[a-z0-9]+"), forbiddenTagValidator(() => this.tags, this.existingTagsFormArray)]],
    layerFiles: this.layerFilesFormArray
  })

  get layerName() {
    return this.layerUploadForm.get('layerName');
  }

  get newTagInput() {
    return this.layerUploadForm.get('newTagInput');
  }

  get existingTagInput() {
    return this.layerUploadForm.get('existingTagInput');
  }

  get existingTags(): FormArray {
    return this.layerUploadForm.controls['existingTags'] as FormArray;
  }

  get layerFiles(): FormArray {
    return this.layerUploadForm.controls['layerFiles'] as FormArray;
  }

  onSubmit() {
    this.serverProgress = 100;
    this.disableEnableForm(true);

    const tags: Array<string> = [];
    this.existingTags.controls.forEach((formGroup) => {
      tags.push(formGroup.get('tagName')?.value);
    });
    const layerUpload: Layerupload = { layerName: this.layerName?.value, layerType: this.layerType.value, tags: tags, layerId: undefined };

    this.layerUploadService.createContainer(layerUpload)
      .pipe(catchError((error: HttpErrorResponse) => {
        this.serverProgress = 0;
        this.imageValidationProgress = 0;
        this.disableEnableForm(false);
        return throwError(() => new Error());
      }))
      .subscribe(({ blobSasUrl, layerId }) => {
        var zip = new JSZip();
        this.layerFiles.controls.forEach(layerFile => zip.file(layerFile.get('imageName')?.value, layerFile.get('image')?.value));
        zip.generateAsync({ type: "blob" })
          .then(blob => {
            layerUpload.layerId = layerId;
            var blockBlobClient = new BlockBlobClient(blobSasUrl);
            blockBlobClient.uploadData(blob)
              .then(response => {
                this.layerUploadService.post(layerUpload)
                  .pipe(catchError((error: HttpErrorResponse) => {
                    this.serverProgress = 0;
                    this.imageValidationProgress = 0;
                    this.disableEnableForm(false);
                    return throwError(() => new Error());
                  }))
                  .subscribe(() => {
                    window.location.reload();
                  });
              })
              .catch(reason => {
                this.serverProgress = 0;
                this.imageValidationProgress = 0;
                this.disableEnableForm(false);
                this.toastService.show('Error uploading file to azure', this.router.url);
              });
          })
          .catch(reason => {
            this.serverProgress = 0;
            this.imageValidationProgress = 0;
            this.disableEnableForm(false);
            this.toastService.show('Error generating zip', this.router.url);
          });
      });
  }

  disableEnableForm(isDisabled: boolean) {
    if (isDisabled) {
      this.layerUploadForm.disable({
        emitEvent: false
      });
    } else {
      this.layerUploadForm.enable({
        emitEvent: false
      });
    }
    this.disableOtherControls = isDisabled;
  }

  uploadSub!: Subscription;
  serverProgress = 0;
  imageValidationProgress = 0;
  disableOtherControls = false;

  reset = () => {
    window.location.reload();
  }

  formatter = (tag: Tag) => tag.tagName;

  search: OperatorFunction<string, readonly { tagId: any; tagName: any }[]> = (
    text$: Observable<string>
  ) =>
    text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      filter((term) => term.length >= 1),
      map((term) =>
        this.tags
          .filter((tag) => new RegExp(term, 'mi').test(tag.tagName))
          .slice(0, 10)
      )
    );

  selectItem = (selectItem: any) => {
    const existingTagForm = this.formBuilder.group({
      tagName: [selectItem.item.tagName, [Validators.pattern("[a-z0-9]+"), Validators.maxLength(20), Validators.required]],
      tagId: [selectItem.item.tagId, [Validators.required]]
    });
    this.existingTags.push(existingTagForm);

    selectItem.preventDefault();

    this.tags = this.tags.filter(tag => tag.tagId !== selectItem.item.tagId);
    this.existingTagInput?.setValue(null);
  };

  removeExistingTag = (index: number) => {
    this.existingTags.removeAt(index);
  };

  onNewTagKeydown = (event: any) => {
    event.preventDefault();
    if (this.newTagInput?.valid && this.newTagInput?.value.length > 0) {

      const newTagForm = this.formBuilder.group({
        tagName: [this.newTagInput.value, [Validators.pattern("[a-z0-9]+"), Validators.maxLength(20), Validators.required]],
        tagId: [0, [Validators.required]]
      });
      this.existingTags.push(newTagForm);

      this.newTagInput.setValue('');
    }
  }

  onFileUpload = async (event: any) => {
    const files = (event.target as HTMLInputElement).files;

    this.layerFilesFormArray.clear();

    var self = this;
    Array.prototype.forEach.call(files, function (file) {
      var imageForm = self.formBuilder.group({
        imageName: [file.name, [Validators.required, Validators.pattern("^.*(\.png)$"), forbiddenImageNumberNameValidator()]],
        image: [null, [Validators.required], [self.forbiddenImageValidator()]]
      });

      imageForm.patchValue({
        image: file
      });

      self.layerFilesFormArray.push(imageForm);
    });
  }

  get imageWidth() {
    return 3840;
  }

  get imageHeight() {
    return 2160;
  }

  get numberOfImages() {
    return 64;
  }

  get maxFileSizeMB(){
    return 225;
  }

  maxSizeValidator(): ValidatorFn {
    return (formArray: AbstractControl) => {
      if (formArray instanceof FormArray) {
        const totalBytes = formArray.controls
          .map((control) => {
            var imageGroup = control as FormGroup;
            if (imageGroup){
              var fileControl = imageGroup.get('image');
              if (fileControl){
                  var file = fileControl.value as File;
                  if (file){
                    return file.size; 
                  }
                  return 0;
              }

              throw new Error('formArray is not an instance of FormArray');
            }

            throw new Error('formArray is not an instance of FormArray');
          })
          .reduce((prev, next) => prev + next, 0);

          var totalMB = Math.round((totalBytes / byteMultiplier / byteMultiplier) * 100 + Number.EPSILON ) / 100;
          if (totalMB > this.maxFileSizeMB){
            return { forbiddenImageSize: { value: totalMB } };
          }

          return null;
      }
  
      throw new Error('formArray is not an instance of FormArray');
    }
  };
  

  forbiddenImageValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Promise<ValidationErrors | null> => {
      var self = this;
      return new Promise((resolve, reject) => {
        const file: File = control.value;
        if (!file || file.type !== "image/png") {
          resolve({ forbiddenImageUnknown: { value: control.value } });
        }
        var reader = new FileReader();
        reader.onload = function (readerEvent) {
          var src = readerEvent?.target?.result?.toString() ?? "";
          var image = new Image();
          image.onload = function () {
            if (image.width !== self.imageWidth) {
              resolve({ forbiddenImageWidth: { value: image.width } });
            }
            if (image.height !== self.imageHeight) {
              resolve({ forbiddenImageHeight: { value: image.height } });;
            }

            var shouldHaveTransparency = self.layerType?.value === 2;
            var canvas = document.createElement("canvas");
            var canvasContext = canvas.getContext("2d");

            canvas.width = image.width;
            canvas.height = image.height;

            canvasContext?.drawImage(image, 0, 0);

            var imgData = canvasContext?.getImageData(0, 0, canvas.width, canvas.height);
            var data = imgData?.data;
            var hasTransparency = false;
            if (data) {
              for (var i = 0; i < data.length; i += 4) {
                if (data[i + 3] < 255) {
                  hasTransparency = true;
                  break;
                }
              }
            }

            if (shouldHaveTransparency !== hasTransparency) {
              resolve({ forbiddenImageTransparency: { value: shouldHaveTransparency } });
            }

            resolve(null);
          }
          image.onerror = reject;
          image.src = src;
        }
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    };
  }
}

// horrible hack as this weirdly only gets the first assigned value whereas formcontrols are fine
export interface TagFunc {
  (): Tag[]
}

export function forbiddenTagValidator(servertags: TagFunc, formTags: FormArray): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    var isTaken = servertags().some(tag => tag.tagName === control.value) || formTags.controls.some(formGroup => formGroup?.get('tagName')?.value === control.value);
    return isTaken ? { forbiddenTagName: { value: control.value } } : null;
  };
}

export function forbiddenImageNumberNameValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    var matches = control.value.match(/\d+/g);
    return (!matches || !control.value.endsWith(matches[matches.length - 1] + ".png")) ? { forbiddenImageNumberName: { value: control.value } } : null;
  };
}