import {
  FlashList,
  type FlashListProps,
  type ListRenderItem,
  type ListRenderItemInfo,
} from '@shopify/flash-list';
import { useMemo } from 'react';
import { lcm, omit } from './utils';
import React from 'react';

interface ElementSection {
  element: React.ReactElement | null;
  sticky?: boolean;
  type?: string;
}

interface DataSection<ItemT> {
  data: ItemT[];
  renderItem: ListRenderItem<ItemT>;
  type?: string; // <- default: sectionIndex
  header?: ElementSection;
  footer?: ElementSection;
  stickyHeaderIndices?: number[];
  numOfColumns?: number;
}

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
    sections: (DataSection<any> | ElementSection)[];
  },
  ref: any
) {
  let { sections, ...props } = propsOrigin;
  props = omit(propsOrigin, omitProps, false);

  const {
    dataSections,
    sectionStartIndices,
    data,
    stickyHeaderIndices,
    numOfColumns,
  } = useMemo(() => {
    const dataSections: DataSection<any>[] = [];

    const numOfColumnArray: number[] = [];

    const stickyHeaderIndices: number[] = [];
    let index = 0;

    const sectionStartIndices: number[] = [];

    const data = sections.reduce<Array<any>>(
      (acc, cur: DataSection<any> | ElementSection) => {
        const section: DataSection<any> = isElementSection(cur)
          ? convertDataSectionFrom(cur as ElementSection)
          : (cur as DataSection<any>);

        dataSections.push(section);

        const {
          data,
          header,
          footer,
          stickyHeaderIndices: stickyHeaderIndicesOfSection,
          numOfColumns,
        } = section;
        let length = data.length;

        sectionStartIndices.push(index);
        numOfColumnArray.push(numOfColumns ?? 1);

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
  }, [sections]);

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
      renderItem={({ index, ...etc }: ListRenderItemInfo<any>) => {
        const sectionIndex = getSectionIndexOf(index);
        const section = dataSections[sectionIndex];
        const sectionStartIndex = sectionStartIndices[sectionIndex];
        if (!section || sectionStartIndex === undefined) {
          return null;
        }

        let offset = 0;

        if (section.header && index === sectionStartIndex) {
          offset = 1;
          return section.header.element;
        }

        if (
          section.footer &&
          index ===
            sectionStartIndex + section.data.length + (section.header ? 1 : 0)
        ) {
          return section.footer.element;
        }

        return section.renderItem({
          index: index - sectionStartIndex - offset,
          ...etc,
        });
      }}
      getItemType={(_, index) => {
        const sectionIndex = getSectionIndexOf(index);
        const section = dataSections[sectionIndex];
        const sectionStartIndex = sectionStartIndices[sectionIndex];
        if (!section || sectionStartIndex === undefined) {
          return -1;
        }

        if (section.header && index === sectionStartIndex) {
          return section.header.type ?? `header-${sectionIndex}`;
        }

        if (
          section.footer &&
          index ===
            sectionStartIndex + section.data.length + (section.header ? 1 : 0)
        ) {
          return section.footer.type ?? `footer-${sectionIndex}`;
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

        if (
          (section.header && index === sectionStartIndex) ||
          (section.footer &&
            index ===
              sectionStartIndex +
                section.data.length +
                (section.header ? 1 : 0))
        ) {
          layout.span = numOfColumns;
        } else {
          const span = section.numOfColumns
            ? numOfColumns / section.numOfColumns
            : numOfColumns;

          layout.span = span;
        }
      }}
    />
  );
}

export default React.forwardRef(FlashSectionList);
