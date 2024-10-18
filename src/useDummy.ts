import { useMemo } from 'react';
import Dummy from './Dummy';
import LayoutManager from './LayoutManager';

export const useDummy = ({
  horizontal,
  accuracy = 2,
  DummyClass = Dummy,
  LayoutManagerClass = LayoutManager,
}: {
  horizontal?: boolean | null;
  accuracy?: number;
  DummyClass?: typeof Dummy;
  LayoutManagerClass?: typeof LayoutManager;
}) => {
  return useMemo(() => {
    return new DummyClass(new LayoutManagerClass({ horizontal, accuracy }));
  }, [DummyClass, LayoutManagerClass, horizontal, accuracy]);
};
