import { useEffect, useState } from 'react';
import { View } from 'react-native';
import type LayoutManager from './LayoutManager';

interface Layout {
  width: number;
  height: number;
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

export default Dummy;
