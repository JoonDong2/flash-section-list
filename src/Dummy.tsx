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

  layouts: Map<number, Layout> = new Map();
  listener: Map<number, Set<Listener>> = new Map();
  addListener(sectionIndex: number, listener: Listener) {
    let listeners = this.getListeners(sectionIndex);
    if (!listeners) {
      listeners = new Set();
      this.listener.set(sectionIndex, listeners);
    }
    listeners.add(listener);

    return () => {
      const listeners = this.getListeners(sectionIndex);
      if (!listeners) return;
      listeners.delete(listener);
      if (listeners.size === 0) {
        this.listener.delete(sectionIndex);
      }
    };
  }

  getListeners(sectionIndex: number) {
    return this.listener.get(sectionIndex);
  }

  emitSize(sectionIndex: number, size: Layout) {
    const oldSize = this.getLayout(sectionIndex);
    if (oldSize && !this.layoutManager.isChanged(oldSize, size)) {
      return;
    }

    this.setLayout(sectionIndex, size);
    const listeners = this.getListeners(sectionIndex);
    listeners?.forEach((listener) => {
      listener(size);
    });
  }

  getLayout(sectionIndex: number) {
    return this.layouts.get(sectionIndex);
  }

  setLayout(sectionIndex: number, { width, height }: Layout) {
    this.layouts.set(sectionIndex, { width, height });
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
      const layout = this.getLayout(sectionIndex);
      setSize(this.layoutManager.getSize(layout));

      const clean = this.addListener(sectionIndex, (layout) => {
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
