async function main() {
	const startDate = new Date('2025-04-01');
	const endDate = new Date('2025-04-30');
	function getDatesBetween(startDate, endDate) {
		const dates = [];
		const currentDate = new Date(startDate);

		while (currentDate <= endDate) {
			dates.push(new Date(currentDate));
			currentDate.setDate(currentDate.getDate() + 1);
		}

		return dates;
	}

	const dates = getDatesBetween(startDate, endDate);
	const startHour = 15;
  const endHour = 22;
  const timeSlotCount = endHour - startHour;

  const getNumberofExistingTimeSlotColumns = () => {
    const timeSlotCount = document.querySelectorAll('tr.odd, tr.even')[0].querySelectorAll('input[type="text"][id*="edit-field"]').length;
    return timeSlotCount;
  }
  let timeSlotColumns = getNumberofExistingTimeSlotColumns();
  if (timeSlotColumns > timeSlotCount) {
    throw new Error(
      `There are more time slots than hours to add appointments for (timeSlotColumns: ${timeSlotColumns}, timeSlotCount: ${timeSlotCount})`
    );
  }
  while (timeSlotColumns < timeSlotCount) {
    console.log('Adding time slot column');
    simulateFullClick(document.querySelector('input[value="More suggestions"]'));
    await new Promise((resolve) => setTimeout(resolve, 500));
    timeSlotColumns++;
  }

	const getNumberofExistingRows = () => {
		const rowCount = document.querySelectorAll('tr.odd, tr.even').length;
		console.log(`Number of existing rows: ${rowCount}`);
		return rowCount;
	};
	let rowCount = getNumberofExistingRows();
	if (rowCount > dates.length) {
		throw new Error(
			`There are more rows than dates to add appointments for (rowCount: ${rowCount}, length of dates array: ${dates.length})`
		);
	}

	function simulateFullClick(element) {
		const mouseDown = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
		const mouseUp = new MouseEvent('mouseup', { bubbles: true, cancelable: true });
		const click = new MouseEvent('click', { bubbles: true, cancelable: true });

		element.dispatchEvent(mouseDown);
		element.dispatchEvent(mouseUp);
		element.dispatchEvent(click);
	}

	while (rowCount < dates.length) {
		console.log('Adding row');
		simulateFullClick(document.querySelector('input[value="More choices"]'));
		await new Promise((resolve) => setTimeout(resolve, 500));
		rowCount++;
	}

	const rows = Array.from(document.querySelectorAll('tr.odd, tr.even'));
	for (const [i, row] of rows.entries()) {
		const date = dates[i];
		const daySelect = row.querySelector('select[id*="edit-field"][id*="day"]');
		daySelect.value = `${date.getDate()}`;
		const monthSelect = row.querySelector('select[id*="edit-field"][id*="month"]');
		monthSelect.value = `${date.getMonth() + 1}`;
		const yearSelect = row.querySelector('select[id*="edit-field"][id*="year"]');
		yearSelect.value = `${date.getFullYear()}`;

		const timeSlotInputs = Array.from(row.querySelectorAll('input[type="text"][id*="edit-field"]'));
		for (const [j, input] of timeSlotInputs.entries()) {
			if (input instanceof HTMLInputElement) {
				input.value = `${startHour + j}:00->${startHour + j + 1}:00`;
			} else throw Error(`Expected input in row ${i + 1} to be a select element`);
		}
	}
}

main();
