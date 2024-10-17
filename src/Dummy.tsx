import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';

interface Layout {
  width: number;
  height: number;
}

class LayoutManager {
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

type Listener = (size: Layout) => void;

class Dummy {
  type = '~d!u@m#m$y%^&*()';
  layoutManager: LayoutManager;

  constructor(layoutManager: LayoutManager) {
    this.layoutManager = layoutManager;
  }

  localIndices: Map<number, number> = new Map(); // key: sectionIndex, value: localIndex
  layouts: Map<number, Layout> = new Map(); // key: sectionIndex, value: Layout
  listeners: Map<number, Listener> = new Map();
  setListener(sectionIndex: number, listener: Listener) {
    this.listeners.set(sectionIndex, listener);

    return () => {
      this.listeners.delete(sectionIndex);
    };
  }

  getListener(sectionIndex: number) {
    return this.listeners.get(sectionIndex);
  }

  emitSize(sectionIndex: number, localIndex: number, layout: Layout) {
    const oldLocalIndex = this.localIndices.get(sectionIndex) ?? 0;
    if (localIndex < oldLocalIndex) return;
    this.localIndices.set(sectionIndex, localIndex);

    const oldLayout = this.layouts.get(sectionIndex);
    if (oldLayout && !this.layoutManager.isChanged(oldLayout, layout)) {
      return;
    }

    this.layouts.set(sectionIndex, layout);
    this.getListener(sectionIndex)?.(layout);
  }

  View = ({
    sectionIndex,
    disabled,
  }: {
    sectionIndex: number;
    disabled?: boolean;
  }) => {
    const [size, setSize] = useState<number | undefined>();
    useEffect(() => {
      if (disabled) return;
      const layout = this.layouts.get(sectionIndex);
      setSize(this.layoutManager.getSize(layout));

      const clean = this.setListener(sectionIndex, (layout) => {
        setSize(this.layoutManager.getSize(layout));
      });
      return () => {
        clean();
      };
    }, [sectionIndex, disabled]);

    return (
      <View
        style={
          !disabled && {
            [this.layoutManager.getSizeProperty()]: size,
          }
        }
      />
    );
  };
}

export const useDummy = ({
  horizontal,
  accuracy = 2,
}: {
  horizontal?: boolean | null;
  accuracy?: number;
}) => {
  return useMemo(() => {
    return new Dummy(new LayoutManager({ horizontal, accuracy }));
  }, [horizontal, accuracy]);
};

export default Dummy;
