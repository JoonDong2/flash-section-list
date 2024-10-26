import {
  FlashList,
  type FlashListProps,
  type ListRenderItem,
  type ListRenderItemInfo,
} from '@shopify/flash-list';
import { useImperativeHandle, useMemo, useRef, useState } from 'react';
import { findFirstProp, lcm, omit } from './utils';
import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useDummy } from './useDummy';
import Dummy from './Dummy';
import LayoutManager from './LayoutManager';

export interface ElementSection {
  element: React.ReactElement | null;
  sticky?: boolean;
  type?: string;
  size?: number;
}

const methodNames = [
  'prepareForLayoutAnimationRender',
  'recordInteraction',
  'recomputeViewableItems',
  'scrollToEnd',
  'scrollToIndex',
  'scrollToItem',
  'scrollToOffset',
] as const;

export interface DataSection<ItemT> {
  data: ItemT[];
  renderItem: ListRenderItem<ItemT>;
  type?: string; // <- default: sectionIndex
  header?: ElementSection;
  footer?: ElementSection;
  stickyHeaderIndices?: number[];
  numOfColumns?: number;
  itemSize?: number; // vertical list -> height, horizontal list -> width
  gap?:
    | number
    | {
        size: number;
        includeEdge?: boolean;
      };
}

export type WithDummyCount<T> = T & {
  dummyCount?: number;
};

export type Section = ElementSection | DataSection<any>;

export interface FlashSectionListHandle {
  prepareForLayoutAnimationRender: () => void;
  recordInteraction: () => void;
  recomputeViewableItems: () => void;
  scrollToEnd?: (params?: { animated?: boolean | null | undefined }) => void;
  scrollToIndex: (params: {
    animated?: boolean | null | undefined;
    index: number;
    viewOffset?: number | undefined;
    viewPosition?: number | undefined;
  }) => void;
  scrollToItem: (params: {
    animated?: boolean | null | undefined;
    item: any;
    viewPosition?: number | undefined;
  }) => void;
  scrollToOffset: (params: {
    animated?: boolean | null | undefined;
    offset: number;
  }) => void;
  scrollToSection: (params: {
    animated?: boolean | null | undefined;
    sectionIndex: number;
    viewOffset?: number | undefined;
    viewPosition?: number | undefined;
  }) => void;
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

const flex1 = { flex: 1 } as const;

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

export function FlashSectionListBuilder() {
  const buildProps = {
    FlashListComponent: FlashList,
    DummyClass: Dummy,
    LayoutManagerClass: LayoutManager,
  };

  return {
    build: () => {
      const FlashListComponent = buildProps.FlashListComponent;
      const DummyClass = buildProps.DummyClass;
      const LayoutManagerClass = buildProps.LayoutManagerClass;

      function FlashSectionList(
        propsOrigin: Omit<FlashListProps<any>, (typeof omitProps)[number]> & {
          sections: Section[];
        },
        ref: any
      ) {
        const flashlist = useRef<any>(null);

        const [containerWidth, setContainerWidth] = useState<
          number | undefined
        >(undefined);

        let { sections, ...props } = propsOrigin;
        props = omit(propsOrigin, omitProps, false);

        const contentContainerPaddingHorizontal = useMemo(() => {
          const paddingHorizontal = findFirstProp(props.contentContainerStyle, [
            'paddingHorizontal',
            'paddingLeft',
          ]);
          return typeof paddingHorizontal === 'number'
            ? paddingHorizontal * 2
            : 0;
        }, [props.contentContainerStyle]);

        const Dummy = useDummy({
          horizontal: props.horizontal,
          DummyClass,
          LayoutManagerClass,
        });

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
              const section: WithDummyCount<DataSection<any>> =
                isElementSection(cur)
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

        useImperativeHandle(ref, () => {
          const mothods = methodNames.reduce((acc, cur) => {
            acc[cur] = (...props: any) => {
              flashlist.current?.[cur](...props);
            };
            return acc;
          }, {} as any);

          return {
            ...flashlist.current,
            ...mothods,
            scrollToSection: (params: {
              animated?: boolean | null | undefined;
              sectionIndex: number;
              viewOffset?: number | undefined;
              viewPosition?: number | undefined;
            }) => {
              if (
                !Array.isArray(sectionStartIndices) ||
                sectionStartIndices.length === 0
              ) {
                return;
              }

              const index = sectionStartIndices[params.sectionIndex];
              if (index === undefined) {
                return;
              }
              flashlist.current?.scrollToIndex?.({
                ...params,
                index,
              });
            },
          };
        }, [sectionStartIndices]);

        return (
          <FlashListComponent
            {...props}
            ref={flashlist as any}
            onLayout={
              !props.horizontal
                ? (e) => {
                    setContainerWidth(e.nativeEvent?.layout?.width);
                    props.onLayout?.(e);
                  }
                : props.onLayout
            }
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
                  <Dummy.View
                    sectionIndex={sectionIndex}
                    disabled={!isLastDummy}
                  />
                );
              }

              const isHeader = section.header && index === sectionStartIndex;
              if (isHeader) {
                return <View style={flex1}>{section.header!.element}</View>;
              }

              const isFooter =
                section.footer &&
                index ===
                  sectionStartIndex +
                    section.data.length +
                    headerOffset +
                    (section.dummyCount ?? 0);
              if (isFooter) {
                return <View style={flex1}>{section.footer!.element}</View>;
              }

              let style: StyleProp<ViewStyle>;

              if (section.gap && containerWidth) {
                const sectionNumOfColumns = section.numOfColumns ?? 1;

                const numOfRows = Math.floor(
                  (section.data.length - 1) / (section.numOfColumns ?? 1)
                );

                const includeEdge =
                  !(typeof section.gap === 'number') &&
                  !!section.gap.includeEdge;

                const gap =
                  typeof section.gap === 'number'
                    ? section.gap
                    : section.gap.size;

                const numOfGaps = includeEdge
                  ? sectionNumOfColumns + 1
                  : sectionNumOfColumns - 1;

                const itemWidth =
                  (containerWidth -
                    contentContainerPaddingHorizontal -
                    numOfGaps * gap) /
                  sectionNumOfColumns;

                style = { width: itemWidth };

                const indexInRow = localIndex % sectionNumOfColumns;

                style.marginLeft = includeEdge
                  ? gap - (gap * indexInRow) / sectionNumOfColumns
                  : (gap * indexInRow) / sectionNumOfColumns;

                if (numOfRows > 0) {
                  const isLastRow =
                    Math.floor(localIndex / sectionNumOfColumns) === numOfRows;
                  if (!isLastRow) {
                    style.marginBottom = gap;
                  }
                }
              } else if (numOfColumns > 1) {
                style = flex1;
              }

              return (
                <View
                  onLayout={(e) => {
                    const layout = e.nativeEvent?.layout;
                    if (!layout) return;
                    const { width, height } = layout;
                    if (!width && !height) return;
                    Dummy.emitSize(sectionIndex, localIndex, { width, height });
                  }}
                  style={style}
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
              if (isHeader) {
                return section.header!.type ?? `header-${sectionIndex}`;
              }

              const isFooter =
                section.footer &&
                index ===
                  sectionStartIndex +
                    section.data.length +
                    headerOffset +
                    (section.dummyCount ?? 0);
              if (isFooter) {
                return section.footer!.type ?? `footer-${sectionIndex}`;
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

              if (isHeader) {
                layout.span = numOfColumns;
                layout.size = section.header!.size;
              } else if (isFooter) {
                layout.span = numOfColumns;
                layout.size = section.footer!.size;
              } else {
                layout.span = section.numOfColumns
                  ? numOfColumns / section.numOfColumns
                  : numOfColumns;
                layout.size = section.itemSize;
              }
            }}
          />
        );
      }
      return React.forwardRef(FlashSectionList);
    },
    setFlashList: (FlashListComponent: any) => {
      buildProps.FlashListComponent = FlashListComponent;
    },
    setDummy: (DummyClass: typeof Dummy) => {
      buildProps.DummyClass = DummyClass;
    },
    setLayoutManager: (LayoutManagerClass: typeof LayoutManager) => {
      buildProps.LayoutManagerClass = LayoutManagerClass;
    },
  };
}

export default FlashSectionListBuilder().build();
