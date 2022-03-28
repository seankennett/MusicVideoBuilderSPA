import { taggedTemplate } from '@angular/compiler/src/output/output_ast';
import { Component, Injectable, OnInit } from '@angular/core';
import { FormBuilder, Validators, FormArray, AbstractControl, ValidationErrors, ValidatorFn, AsyncValidator } from '@angular/forms';
import { Observable, OperatorFunction } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  map,
  filter,
} from 'rxjs/operators';
import { Tag } from '../tag';
import { TagsService } from '../tags.service';
import { ForbiddenImageValidator } from '../forbidden-image-validator'

@Component({
  selector: 'app-layerupload',
  templateUrl: './layerupload.component.html',
  styleUrls: ['./layerupload.component.scss']
})
export class LayerUploadComponent implements OnInit {

  constructor(private formBuilder: FormBuilder, private tagsService: TagsService, private forbiddenImageValidator: ForbiddenImageValidator) { }

  ngOnInit(): void {
    this.getTags();
    this.layerFilesFormArray.statusChanges.subscribe(statusChange =>{
      if (this.layerFilesFormArray.controls.some(control => !control.pending && control.invalid) || statusChange === 'INVALID'){
        this.width = 0;
      }else if (statusChange === 'PENDING'){
        this.width++;
      }
      else if (statusChange === 'VALID'){
        this.width = 100;
      }
    })
  }

  getTags(): void {
    this.tagsService.getTags().subscribe((tags: Tag[]) => {
      this.tags = tags;
    });
  }

  tags: Tag[] = []

  existingTagsFormArray = this.formBuilder.array([], [Validators.required, Validators.minLength(5), Validators.maxLength(15)])
  layerFilesFormArray = this.formBuilder.array([], [Validators.required, Validators.minLength(64), Validators.maxLength(64)])

  layerUploadForm = this.formBuilder.group({
    layerName: ['', [Validators.required, Validators.maxLength(50), Validators.pattern("[A-z0-9]+")]],
    layerType: [1, [Validators.required]],
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
    // TODO: Use EventEmitter with form value
    console.warn(this.layerUploadForm.value);
  }

  formatter = (tag: Tag) => tag.tagName;

  search: OperatorFunction<string, readonly { tagId: any; tagName: any }[]> = (
    text$: Observable<string>
  ) =>
    text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      filter((term) => term.length >= 2),
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
        image: [null, [Validators.required], [self.forbiddenImageValidator.validate.bind(self.forbiddenImageValidator)]]
      });

      imageForm.patchValue({
        image: file
      });

      self.layerFilesFormArray.push(imageForm);
    });
  }

  width = 0;
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