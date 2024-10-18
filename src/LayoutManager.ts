interface Layout {
  width: number;
  height: number;
}

export default class LayoutManager {
  horizontal?: boolean | null;
  accuracy: number;

  constructor({
    horizontal,
    accuracy = 2,
  }: {
    horizontal?: boolean | null;
    accuracy?: number;
  }) {
    this.horizontal = horizontal;
    this.accuracy = accuracy;
  }

  getSize(layout?: Layout) {
    return this.horizontal ? layout?.width : layout?.height;
  }

  isChanged(a?: Layout, b?: Layout) {
    const sizeA = this.getSize(a);
    const sizeB = this.getSize(b);
    if (sizeA === undefined || sizeB === undefined) return true;
    return Math.abs(sizeA - sizeB) > this.accuracy;
  }

  getSizeProperty() {
    return this.horizontal ? 'width' : 'height';
  }
}
