import { Injectable } from '@angular/core';

export const urlRegex = '(https?://)?([\\da-z.-]+)\\.([a-z.]{2,6})[/\\w .-]*/?';
export const nosSpacesRegex = '^[A-Za-z]+$';

@Injectable({
  providedIn: 'root'
})
export class UtilsService {

  constructor(
  ) {
  }

  public objectIsEmpty(obj: Object): boolean {
    return !Object.keys(obj).length;
  }

  /**
   * Receives a main array to update with new data from another array ignoring duplicates.
   * It is a way to manage an array without having to reassign the main array.
   *
   * @param   {any[]}   main         [arr description]
   * @param   {any[]}   newData     [newData description]
   * @param   {string}  identifier  [identifier description]
   *
   * @return  {void}
   */
  public manageNewDataIntoArray(main: any[], newData: any[], identifier: string): void {
    const toRemoveFromMain: number[] = [];
    main.forEach((item, index) => {
      const fromDataindex = newData.findIndex(nItem => nItem[identifier] === item[identifier]);
      if (fromDataindex >= 0) {
        newData.splice(fromDataindex, 1);
      } else {
        toRemoveFromMain.push(index);
      }
    });
    toRemoveFromMain.forEach(index => main.splice(index, 1));
    newData.forEach(item => main.push(item));
  }

  public fillPool(maxAmount: number, startingFrom = 1): number[] {
    const pool: number[] = [];

    for (let i = startingFrom; i <= maxAmount; i++) {
      pool.push(i);
    }

    return pool;
  }

  /**
   * Validates if given string is a hex code
   *
   * @param   {string}   hexCode  The given Hex Code
   *
   * @return  {boolean}
   */
  public validateHexCode(hexCode: string): boolean {

    const firstChar = hexCode.charAt(0);

    if (firstChar !== '#') {
      return false;
    }

    const sixChars = hexCode.substr(1, 6).replace(/[^\w\s]/gi, '');

    if (sixChars.length !== 6) {
      return false;
    }

    return true;
  }

  public truncateHexcode(hexCode: string) {
    const isValid = this.validateHexCode(hexCode);
    if (!isValid) {
      return hexCode.trim()
    }
    return hexCode;
  }

  public shadeHexColor(color: string, percent: number) {
    var f = parseInt(color.slice(1), 16), t = percent < 0 ? 0 : 255, p = percent < 0 ? percent * -1 : percent, R = f >> 16, G = f >> 8 & 0x00FF, B = f & 0x0000FF;
    return (0x1000000 + (Math.round((t - R) * p) + R) * 0x10000 + (Math.round((t - G) * p) + G) * 0x100 + (Math.round((t - B) * p) + B)).toString(16).slice(1);
  }


  /**
   * Used to transfer a value into a referent
   * value in another range
   *
   * @param   {number}  value     Number to be converted
   * @param   {number}  maxValue  Maximum value the number can have on it's current period
   * @param   {number}  min       The minimum value on the referent period
   * @param   {number}  max       The maximum value on the referent period
   *
   * @return  {number} The referent number
   */
  public convertProportions(value: number, maxValue: number, min: number, max: number): number {
    const delta = max - min;
    const converted = ((delta * value) + (min * maxValue)) / maxValue;
    if (converted > max) {
      return max;
    } else if (converted < min) {
      return min;
    }
    return converted;
  }

}
