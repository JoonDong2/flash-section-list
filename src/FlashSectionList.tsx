import {
  FlashList,
  type FlashListProps,
  type ListRenderItem,
  type ListRenderItemInfo,
} from '@shopify/flash-list';
import { useMemo } from 'react';
import { lcm, omit } from './utils';

interface HeaderOrFooter {
  element: React.ReactElement | null;
  sticky?: boolean;
  type?: string;
}

interface Section<ItemT> {
  data: ItemT[];
  renderItem: ListRenderItem<ItemT>;
  type?: string; // <- default: sectionIndex
  header?: HeaderOrFooter;
  footer?: HeaderOrFooter;
  stickyHeaderIndices?: number[];
  numOfColumns?: number;
}

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
    sections: Section<any>[];
  }
) {
  let { sections, ...props } = propsOrigin;
  props = omit(propsOrigin, omitProps, false);

  const { sectionStartIndices, data, stickyHeaderIndices, numOfColumns } =
    useMemo(() => {
      const numOfColumnArray: number[] = [];
      const stickyHeaderIndices: number[] = [];
      let index = 0;
      const sectionStartIndices: number[] = [];
      const data = sections.reduce<Array<any>>((acc, cur: Section<any>) => {
        const {
          data,
          header,
          footer,
          stickyHeaderIndices: stickyHeaderIndicesOfSection,
        } = cur;
        let length = data.length;

        sectionStartIndices.push(index);
        numOfColumnArray.push(cur.numOfColumns ?? 1);

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
              (indexWithinSection) => indexWithinSection + index
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
      }, []);

      return {
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
      data={data}
      stickyHeaderIndices={stickyHeaderIndices}
      numColumns={numOfColumns}
      renderItem={({ index, ...etc }: ListRenderItemInfo<any>) => {
        const sectionIndex = getSectionIndexOf(index);
        const section = sections[sectionIndex];
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
        const section = sections[sectionIndex];
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
        const section = sections[sectionIndex];
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

export default FlashSectionList;
