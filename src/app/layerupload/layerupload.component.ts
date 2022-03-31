import { Component, OnInit } from '@angular/core';
import { MsalService } from '@azure/msal-angular';
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
import { LayerService } from '../layer.service';
import { HttpErrorResponse, HttpEventType } from '@angular/common/http';

@Component({
  selector: 'app-layerupload',
  templateUrl: './layerupload.component.html',
  styleUrls: ['./layerupload.component.scss']
})
export class LayerUploadComponent implements OnInit {

  constructor(private formBuilder: FormBuilder, private tagsService: TagsService, private layerService: LayerService, private authService: MsalService) { }


  ngOnInit(): void {
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
    });
  }

  tags: Tag[] = []

  existingTagsFormArray = this.formBuilder.array([], [Validators.required, Validators.minLength(5), Validators.maxLength(15)])
  layerFilesFormArray = this.formBuilder.array([], [Validators.required, Validators.minLength(this.numberOfImages), Validators.maxLength(this.numberOfImages)])
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
    const formData = new FormData();
    formData.append("layerName", this.layerUploadForm.get('layerName')?.value);
    formData.append("layerType", this.layerType?.value);
    this.layerFiles.controls.forEach((formGroup) => {
      formData.append("files", formGroup.get('image')?.value);
    });
    this.existingTags.controls.forEach((formGroup) => {
      formData.append("layerTags", formGroup.get('tagName')?.value);
    });
    formData.append("userObjectId", this.authService.instance.getAllAccounts()[0].localAccountId);

    this.serverProgress = 100;
    this.layerUploadForm.disable({
      emitEvent: false
    });
    this.disableOtherControls = true;

    this.layerService.upload(formData).pipe(
      catchError((error: HttpErrorResponse) => {
        alert('Something went wrong on the server, try again!');
        this.serverProgress = 0;
        this.uploadProgress = 0;
        this.imageValidationProgress = 0;
        this.disableOtherControls = false;
        this.layerUploadForm.enable({
          emitEvent: false
        });
        return throwError(() => new Error('Something went wrong on the server, try again!'));
      })
    ).subscribe(event => {
      if (event.type == HttpEventType.UploadProgress) {
        var total = event.total ?? 1;
        this.uploadProgress = Math.round(100 * (event.loaded / total));
      } else if (event.type == HttpEventType.Response) {
        if (event.ok) {
          window.location.reload();
        }
      }
    })

  }

  uploadSub!: Subscription;
  uploadProgress = 0;
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

  onFileUpload = (event: any) => {
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