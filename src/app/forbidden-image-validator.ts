import { Injectable } from '@angular/core';
import { AbstractControl, ValidationErrors, AsyncValidator } from '@angular/forms';

@Injectable({ providedIn: 'root' })
export class ForbiddenImageValidator implements AsyncValidator {
    
  validate(control: AbstractControl) : Promise<ValidationErrors  | null> {
    return new Promise((resolve, reject) => {
      const file: File = control.value;
    if (!file) {
      resolve(null);
    }
    var reader = new FileReader();
    reader.onload = function (readerEvent) {
      var src = readerEvent?.target?.result?.toString() ?? "";
      var image = new Image();
      image.onload = function () {
        if (image.width !== 3840) {
          resolve({ forbiddenImageWidth: { value: image.width } });
        }
        if (image.height !== 2160) {
          resolve({ forbiddenImageHeight: { value: image.height } });;
        }

        var shouldHaveTransparency = true;
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
          resolve({ forbiddenImageTransparency: { value: file.name } });
        }

        resolve(null);
      }
      image.onerror = reject;
      image.src = src;
    }
    reader.onerror = reject;
    reader.readAsDataURL(file);
    });
  }
}