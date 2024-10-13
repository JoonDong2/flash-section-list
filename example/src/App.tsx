import { FlashSectionList } from 'flash-section-list';

export default function App() {
  return (
    <FlashSectionList
      estimatedItemSize={110}
      data={[1, 2, 3]}
      renderItem={() => {
        return null;
      }}
    />
  );
}
