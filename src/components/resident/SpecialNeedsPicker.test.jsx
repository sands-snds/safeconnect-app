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

// A form with a people box and the picker, wired like the emergency modals.
function PeopleForm({ initialPeople = '', min = 0 }) {
  const React = require('react');
  const { useSpecialNeedsPeople: useSync } = require('./SpecialNeedsPicker');
  const [form, setForm] = React.useState({ people: initialPeople, special: [], specialCounts: {} });
  const sync = useSync({
    people: form.people, selected: form.special, counts: form.specialCounts, min,
    setPeople: (people) => setForm((f) => ({ ...f, people }))
  });
  return (
    <>
      <input aria-label="people" value={form.people} onBlur={sync.raiseToTotal}
        onChange={(e) => setForm((f) => ({ ...f, people: e.target.value }))} />
      <SpecialNeedsPicker idPrefix="p" selected={form.special} counts={form.specialCounts}
        onToggle={(v) => setForm((f) => ({ ...f, special: f.special.includes(v) ? f.special.filter((x) => x !== v) : [...f.special, v] }))}
        onCountChange={(v, n) => setForm((f) => ({ ...f, specialCounts: { ...f.specialCounts, [v]: n } }))} />
    </>
  );
}

test('the number of people follows the special needs, without counting anyone twice', () => {
  const { getByLabelText, container } = render(<LanguageProvider><PeopleForm /></LanguageProvider>);
  const people = getByLabelText('people');
  const count = (key) => container.querySelector(`#p-count-${key}`);

  fireEvent.change(count('elderly'), { target: { value: '2' } });
  expect(people).toHaveValue('2');
  fireEvent.change(count('children'), { target: { value: '3' } });
  expect(people).toHaveValue('5');
  fireEvent.change(count('pets'), { target: { value: '4' } }); // pets aren't people
  expect(people).toHaveValue('5');
  fireEvent.change(count('children'), { target: { value: '1' } });
  expect(people).toHaveValue('3');

  // A bigger number typed by the resident already includes them.
  fireEvent.change(people, { target: { value: '8' } });
  fireEvent.change(count('elderly'), { target: { value: '4' } });
  expect(people).toHaveValue('8');
  // Below the total: raised to it when the box is left.
  fireEvent.change(people, { target: { value: '2' } });
  fireEvent.blur(people);
  expect(people).toHaveValue('5');
  // Removing them all goes back to the resident's own number.
  fireEvent.change(count('elderly'), { target: { value: '0' } });
  fireEvent.change(count('children'), { target: { value: '0' } });
  expect(people).toHaveValue('2');
});
