import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators, AbstractControl, FormArray  } from '@angular/forms';
import { Observable, OperatorFunction } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  map,
  filter,
} from 'rxjs/operators';

type State = { id: number; name: string };

const states: State[] = [
  { id: 0, name: 'Alabama' },
  { id: 1, name: 'Alaska' },
  { id: 2, name: 'American Samoa' },
  { id: 3, name: 'Arizona' },
  { id: 4, name: 'Arkansas' },
  { id: 5, name: 'California' },
  { id: 6, name: 'Colorado' },
  { id: 7, name: 'Connecticut' },
  { id: 8, name: 'Delaware' },
  { id: 9, name: 'District Of Columbia' },
  { id: 10, name: 'Federated States Of Micronesia' },
  { id: 11, name: 'Florida' },
  { id: 12, name: 'Georgia' },
  { id: 13, name: 'Guam' },
  { id: 14, name: 'Hawaii' },
  { id: 15, name: 'Idaho' },
  { id: 16, name: 'Illinois' },
  { id: 17, name: 'Indiana' },
  { id: 18, name: 'Iowa' },
  { id: 19, name: 'Kansas' },
  { id: 20, name: 'Kentucky' },
  { id: 21, name: 'Louisiana' },
  { id: 22, name: 'Maine' },
  { id: 23, name: 'Marshall Islands' },
  { id: 24, name: 'Maryland' },
  { id: 25, name: 'Massachusetts' },
  { id: 26, name: 'Michigan' },
  { id: 27, name: 'Minnesota' },
  { id: 28, name: 'Mississippi' },
  { id: 29, name: 'Missouri' },
  { id: 30, name: 'Montana' },
  { id: 31, name: 'Nebraska' },
  { id: 32, name: 'Nevada' },
  { id: 33, name: 'New Hampshire' },
  { id: 34, name: 'New Jersey' },
  { id: 35, name: 'New Mexico' },
  { id: 36, name: 'New York' },
  { id: 37, name: 'North Carolina' },
  { id: 38, name: 'North Dakota' },
  { id: 39, name: 'Northern Mariana Islands' },
  { id: 40, name: 'Ohio' },
  { id: 41, name: 'Oklahoma' },
  { id: 42, name: 'Oregon' },
  { id: 43, name: 'Palau' },
  { id: 44, name: 'Pennsylvania' },
  { id: 45, name: 'Puerto Rico' },
  { id: 46, name: 'Rhode Island' },
  { id: 47, name: 'South Carolina' },
  { id: 48, name: 'South Dakota' },
  { id: 49, name: 'Tennessee' },
  { id: 50, name: 'Texas' },
  { id: 51, name: 'Utah' },
  { id: 52, name: 'Vermont' },
  { id: 53, name: 'Virgin Islands' },
  { id: 54, name: 'Virginia' },
  { id: 55, name: 'Washington' },
  { id: 56, name: 'West Virginia' },
  { id: 57, name: 'Wisconsin' },
  { id: 58, name: 'Wyoming' },
];

@Component({
  selector: 'app-layerupload',
  templateUrl: './layerupload.component.html',
  styleUrls: ['./layerupload.component.scss']
})
export class LayerUploadComponent implements OnInit {

  constructor(private formBuilder: FormBuilder) { }

  ngOnInit(): void {
  }

  layerUploadForm = this.formBuilder.group({
    layerName: ['', [Validators.required, Validators.maxLength(50), Validators.pattern("[A-z0-9]+")]],
    layerType: [1, [Validators.required]],
    existingTagInput: [null],
    existingTags: this.formBuilder.array([], Validators.required),
    newTagInput: ['', [Validators.maxLength(50), Validators.pattern("[A-z0-9]+")]]
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

  get existingTags() : FormArray{
    return this.layerUploadForm.controls['existingTags'] as FormArray; 
  }

  onSubmit() {
    // TODO: Use EventEmitter with form value
    console.warn(this.layerUploadForm.value);
  }

  formatter = (state: State) => state.name;

  search: OperatorFunction<string, readonly { id: any; name: any }[]> = (
    text$: Observable<string>
  ) =>
    text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      filter((term) => term.length >= 2),
      map((term) =>
        states
          .filter((state) => new RegExp(term, 'mi').test(state.name))
          .slice(0, 10)
      )
    );

  selectItem = (selectItem: any) => {
    const existingTagForm = this.formBuilder.group({
      tagName: [selectItem.item.name, [Validators.pattern("[A-z0-9]+"), Validators.maxLength(50), Validators.required]],
      tagId: [selectItem.item.id, [Validators.required]]
    }); 
    this.existingTags.push(existingTagForm);

    selectItem.preventDefault();
    this.existingTagInput?.setValue(null);
    //clear from 'states' selected item and also make state populate from rest call on init
  };

  removeExistingTag = (index: number) => {
    this.existingTags.removeAt(index);
  };

  onNewTagKeydown = (event: any) => {
    event.preventDefault();
    if (this.newTagInput?.valid && this.newTagInput?.value.length > 0) {
      
      const newTagForm = this.formBuilder.group({
        tagName: [this.newTagInput.value, [Validators.pattern("[A-z0-9]+"), Validators.maxLength(50), Validators.required]],
        tagId: [0, [Validators.required]]
      }); 
      this.existingTags.push(newTagForm);

      this.newTagInput.setValue('');
    }    
  }
}
