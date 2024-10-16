import {
  FlashList,
  type FlashListProps,
  type ListRenderItem,
  type ListRenderItemInfo,
} from '@shopify/flash-list';
import { useMemo } from 'react';
import { lcm, omit } from './utils';
import React from 'react';
import { View } from 'react-native';
import { useDummy } from './Dummy';

export interface ElementSection {
  element: React.ReactElement | null;
  sticky?: boolean;
  type?: string;
}

export interface DataSection<ItemT> {
  data: ItemT[];
  renderItem: ListRenderItem<ItemT>;
  type?: string; // <- default: sectionIndex
  header?: ElementSection;
  footer?: ElementSection;
  stickyHeaderIndices?: number[];
  numOfColumns?: number;
}

export type WithDummyCount<T> = T & {
  dummyCount?: number;
};

export type Section = ElementSection | DataSection<any>;

const isElementSection = (section: any) => {
  return React.isValidElement((section as ElementSection).element);
};

const convertDataSectionFrom = (section: ElementSection): DataSection<any> => {
  return {
    data: [0],
    renderItem: () => {
      return section.element;
    },
    stickyHeaderIndices: section.sticky ? [0] : undefined,
    type: section.type,
  };
};

const omitProps = [
  'data',
  'renderItem',
  'getItemType',
  'getItemLayout',
  'overrideItemLayout',
  'stickyHeaderIndices',
  'ListHeaderComponent',
  'ListHeaderComponentStyle',
  'ListFooterComponent',
  'ListFooterComponentStyle',
  'numOfColumns',
] as const;

function FlashSectionList(
  propsOrigin: Omit<FlashListProps<any>, (typeof omitProps)[number]> & {
    sections: Section[];
  },
  ref: any
) {
  const Dummy = useDummy();

  let { sections, ...props } = propsOrigin;
  props = omit(propsOrigin, omitProps, false);

  const {
    dataSections,
    sectionStartIndices,
    data,
    stickyHeaderIndices,
    numOfColumns,
  } = useMemo(() => {
    const dataSections: WithDummyCount<DataSection<any>>[] = [];

    const numOfColumnArray: number[] = [];

    const stickyHeaderIndices: number[] = [];
    let index = 0;

    const sectionStartIndices: number[] = [];

    const data = sections.reduce<Array<any>>(
      (acc, cur: DataSection<any> | ElementSection) => {
        const section: WithDummyCount<DataSection<any>> = isElementSection(cur)
          ? convertDataSectionFrom(cur as ElementSection)
          : (cur as DataSection<any>);

        dataSections.push(section);

        const {
          data,
          header,
          footer,
          stickyHeaderIndices: stickyHeaderIndicesOfSection,
          numOfColumns = 1,
        } = section;
        let length = data.length;

        sectionStartIndices.push(index);
        numOfColumnArray.push(numOfColumns);

        if (header) {
          if (header.sticky) {
            stickyHeaderIndices.push(index);
          }

          length += 1;
          acc.push(header);
        }

        acc.push(...data);
        if (stickyHeaderIndicesOfSection) {
          stickyHeaderIndices.push(
            ...stickyHeaderIndicesOfSection.map(
              (indexWithinSection) =>
                indexWithinSection + index + (header ? 1 : 0)
            )
          );
        }

        const dummyCount =
          data.length % numOfColumns !== 0
            ? numOfColumns - (data.length % numOfColumns)
            : 0;

        length += dummyCount;
        section.dummyCount = dummyCount;

        for (let i = 0; i < dummyCount; i++) {
          acc.push(Dummy);
        }

        if (footer) {
          if (footer.sticky) {
            stickyHeaderIndices.push(index + length);
          }
          length += 1;
          acc.push(footer);
        }

        index += length;

        return acc;
      },
      []
    );

    return {
      dataSections,
      sectionStartIndices,
      data,
      stickyHeaderIndices,
      numOfColumns: lcm(numOfColumnArray),
    };
  }, [Dummy, sections]);

  // binary search
  const getSectionIndexOf = (index: number) => {
    if (!sectionStartIndices?.length) return -1;

    let low = 0;
    let high = sectionStartIndices.length - 1;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const midValue = sectionStartIndices[mid]!;
      if (midValue === index) {
        return mid;
      }
      if (low === mid || high === mid) {
        // return low or high
        if (sectionStartIndices[high]! <= index) {
          return high;
        }
        return low;
      }

      // left
      if (midValue > index) {
        high = mid;
      }
      // right
      else if (midValue < index) {
        low = mid;
      }
    }
    return -1;
  };

  return (
    <FlashList
      {...props}
      ref={ref}
      data={data}
      stickyHeaderIndices={stickyHeaderIndices}
      numColumns={numOfColumns}
      renderItem={({ index, item, ...etc }: ListRenderItemInfo<any>) => {
        const sectionIndex = getSectionIndexOf(index);
        const section = dataSections[sectionIndex];
        const sectionStartIndex = sectionStartIndices[sectionIndex];
        if (!section || sectionStartIndex === undefined) {
          return null;
        }

        const headerOffset = section.header ? 1 : 0;

        const dataLastIndex = section.data.length - 1;
        const localIndex = index - sectionStartIndex - headerOffset;

        if (item === Dummy) {
          const isLastDummy =
            localIndex === dataLastIndex + (section.dummyCount ?? 0);

          return (
            <Dummy.View sectionIndex={sectionIndex} disabled={!isLastDummy} />
          );
        }

        const isHeader = section.header && index === sectionStartIndex;
        const isFooter =
          section.footer &&
          index ===
            sectionStartIndex +
              section.data.length +
              headerOffset +
              (section.dummyCount ?? 0);

        if (isHeader) {
          return section.header?.element ?? null;
        }

        if (isFooter) {
          return section.footer?.element ?? null;
        }

        return (
          <View
            onLayout={(e) => {
              const layout = e.nativeEvent?.layout;
              if (!layout) return;
              const { width, height } = layout;
              if (!width && !height) return;
              Dummy.emitSize(sectionIndex, { width, height });
            }}
          >
            {section.renderItem({
              index: localIndex,
              item,
              ...etc,
            })}
          </View>
        );
      }}
      getItemType={(item, index) => {
        const sectionIndex = getSectionIndexOf(index);
        const section = dataSections[sectionIndex];
        const sectionStartIndex = sectionStartIndices[sectionIndex];
        if (!section || sectionStartIndex === undefined) {
          return -1;
        }

        if (item === Dummy) {
          return Dummy.type;
        }

        const headerOffset = section.header ? 1 : 0;
        const isHeader = section.header && index === sectionStartIndex;
        const isFooter =
          section.footer &&
          index ===
            sectionStartIndex +
              section.data.length +
              headerOffset +
              (section.dummyCount ?? 0);

        if (isHeader) {
          return section.header?.type ?? `header-${sectionIndex}`;
        }

        if (isFooter) {
          return section.footer?.type ?? `footer-${sectionIndex}`;
        }

        return section.type ?? sectionIndex;
      }}
      overrideItemLayout={(layout, _, index) => {
        const sectionIndex = getSectionIndexOf(index);
        const section = dataSections[sectionIndex];
        const sectionStartIndex = sectionStartIndices[sectionIndex];
        if (!section || sectionStartIndex === undefined) {
          return;
        }

        const headerOffset = section.header ? 1 : 0;
        const isHeader = section.header && index === sectionStartIndex;
        const isFooter =
          section.footer &&
          index ===
            sectionStartIndex +
              section.data.length +
              headerOffset +
              (section.dummyCount ?? 0);

        if (isHeader || isFooter) {
          layout.span = numOfColumns;
        } else {
          layout.span = section.numOfColumns
            ? numOfColumns / section.numOfColumns
            : numOfColumns;
        }
      }}
    />
  );
}

export default React.forwardRef(FlashSectionList);
