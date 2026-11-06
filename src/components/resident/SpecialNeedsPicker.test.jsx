import { render, fireEvent } from '@testing-library/react';
import SpecialNeedsPicker from './SpecialNeedsPicker';
import { LanguageProvider } from '../../i18n/LanguageContext';

const setup = (selected = []) => {
  const onToggle = jest.fn();
  const onCountChange = jest.fn();
  const utils = render(
    <LanguageProvider>
      <SpecialNeedsPicker idPrefix="t" selected={selected} counts={{}} onToggle={onToggle} onCountChange={onCountChange} />
    </LanguageProvider>
  );
  return { ...utils, onToggle, onCountChange, box: utils.container.querySelector('#t-count-elderly') };
};

test('a typed count keeps only its digits', () => {
  const { box, onCountChange, onToggle } = setup();
  fireEvent.change(box, { target: { value: '12a' } });
  expect(onCountChange).toHaveBeenLastCalledWith('Elderly', '12');
  expect(onToggle).toHaveBeenCalledWith('Elderly');
});

test('letters alone count as nothing', () => {
  const { box, onCountChange } = setup(['Elderly']);
  fireEvent.change(box, { target: { value: 'abc' } });
  expect(onCountChange).toHaveBeenLastCalledWith('Elderly', '');
});
