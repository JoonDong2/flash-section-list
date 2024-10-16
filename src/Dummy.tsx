import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';

interface Size {
  width: number;
  height: number;
}

abstract class Comparator<T> {
  accuracy: number;
  constructor(accuracy: number) {
    this.accuracy = accuracy;
  }
  abstract isChanged(size1: T, size2: T): boolean;
}

class SizeComparator extends Comparator<Size> {
  override isChanged(size1: Size, size2: Size): boolean {
    return (
      Math.abs(size1.height - size2.height) > this.accuracy ||
      Math.abs(size1.width - size2.width) > this.accuracy
    );
  }
}

type Listener = (size: Size) => void;

class Dummy {
  type = '~d!u@m#m$y%^&*()';
  comparator: Comparator<Size>;

  constructor(comparator: Comparator<Size>) {
    this.comparator = comparator;
  }

  dummySizes: Map<number, Size> = new Map();
  dummyListeners: Map<number, Set<Listener>> = new Map();
  addListener(sectionIndex: number, listener: Listener) {
    let listeners = this.getListeners(sectionIndex);
    if (!listeners) {
      listeners = new Set();
      this.dummyListeners.set(sectionIndex, listeners);
    }
    listeners.add(listener);

    return () => {
      const listeners = this.getListeners(sectionIndex);
      if (!listeners) return;
      listeners.delete(listener);
      if (listeners.size === 0) {
        this.dummyListeners.delete(sectionIndex);
      }
    };
  }

  getListeners(sectionIndex: number) {
    return this.dummyListeners.get(sectionIndex);
  }

  emitSize(sectionIndex: number, size: Size) {
    const oldSize = this.getSize(sectionIndex);
    if (oldSize && !this.comparator.isChanged(oldSize, size)) {
      return;
    }

    this.setSize(sectionIndex, size);
    const listeners = this.getListeners(sectionIndex);
    listeners?.forEach((listener) => {
      listener(size);
    });
  }

  getSize(sectionIndex: number) {
    return this.dummySizes.get(sectionIndex);
  }

  setSize(sectionIndex: number, { width, height }: Size) {
    this.dummySizes.set(sectionIndex, {
      width: Math.round(width),
      height: Math.round(height),
    });
  }

  View = ({
    sectionIndex,
    disabled,
  }: {
    sectionIndex: number;
    disabled?: boolean;
  }) => {
    const [size, setSize] = useState<Partial<Size>>({});
    useEffect(() => {
      if (disabled) return;
      const size = this.dummySizes.get(sectionIndex);
      if (size) {
        setSize(size);
      }
      const clean = this.addListener(sectionIndex, (size) => {
        setSize(size);
      });
      return () => {
        clean();
      };
    }, [sectionIndex, disabled]);

    return (
      <View
        style={
          !disabled && {
            width: size.width,
            height: size.height,
          }
        }
      />
    );
  };
}

export const useDummy = () => {
  return useMemo(() => {
    return new Dummy(new SizeComparator(2));
  }, []);
};

export default Dummy;
