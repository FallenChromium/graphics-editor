export class Stack<T> {
    private _data: T[];
  
    constructor() {
      this._data = [];
    }
  
    push(item: T): void {
      this._data.push(item);
    }
  
    pop(): T | undefined {
      return this._data.pop();
    }
  
    peek(): T | undefined {
      return this._data[this._data.length - 1];
    }
  
    get size(): number {
      return this._data.length;
    }
  
    get empty(): boolean {
      return this._data.length === 0;
    }
  }