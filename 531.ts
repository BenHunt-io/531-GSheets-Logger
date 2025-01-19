export type WeekWeightConfig = {
  // In A1 notation
  OneRepMaxSheetKey: {
    [key: string]: string;
  }
  week: { 
    [key: number]: {
      sets: {
        weight: number;
        targetReps: number;
        notes?: string;
        restMinutes: number;
      }[];
    }
  };
};

const weekWeightConfig: WeekWeightConfig = {
  OneRepMaxSheetKey: {
    "Barbell Bench Press": "L3",
    "Overhead Press": "M3",
    "Bulgarian Split Squat": "N3",
    "Deadlift": "O3",
    "Squat": "P3",
  },
  // Week 1 (5s Week):
  // 65% TM × 5 reps
  // 75% TM × 5 reps
  // 85% TM × 5+ reps (AMRAP)
  week: {
    1: {
      sets: [{
        weight: 0.65,
        targetReps: 5,
        restMinutes: 1,
    }, {
      weight: 0.75,
      targetReps: 5,
      restMinutes: 1,
    }, {
      weight: 0.85,
      targetReps: 5,
      notes: "AMRAP",
      restMinutes: 3,
    }],
  },
  // Week 2 (3s Week):
  // 70% TM × 3 reps
  // 80% TM × 3 reps
  // 90% TM × 3+ reps (AMRAP)
  2: {
    sets: [{
      weight: 0.70,
      targetReps: 3,
      restMinutes: 1,
    }, {
      weight: 0.80,
      targetReps: 3,
      restMinutes: 1,
    }, {
      weight: 0.90,
      targetReps: 3,
      notes: "AMRAP",
      restMinutes: 3,
    }]
  },
  // Week 3 (5/3/1 Week):
  // 75% TM × 5 reps
  // 85% TM × 3 reps
  // 95% TM × 1+ reps (AMRAP)
  3: {
    sets: [{
      weight: 0.75,
      targetReps: 5,
      restMinutes: 1,
    }, {
      weight: 0.85,
      targetReps: 3,
      restMinutes: 1,
    }, {
      weight: 0.95,
      targetReps: 1,
      notes: "AMRAP",
      restMinutes: 3,
    }]
  },
  // Week 4 (Deload Week):
  // 40% TM × 5 reps
  // 50% TM × 5 reps
  // 60% TM × 5 reps
  4: {
    sets: [{
      weight: 0.40,
      targetReps: 5,
      restMinutes: 1,
    }, {
      weight: 0.50,
      targetReps: 5,
      restMinutes: 1,
    }, {
        weight: 0.60,
        targetReps: 5,
        restMinutes: 1,
      }]
    }
  }
}

function createNewWorkout(){
   const sheet = SpreadsheetApp.getActiveSheet();
   const liftName = sheet.getRange("L2").getValue();
   const nextLiftWeek = getNextLiftWeek(sheet, liftName);

   for(let i = 0; i<3; i++){

    const oneRepMaxSheetKey = weekWeightConfig.OneRepMaxSheetKey[liftName];
    const oneRepMax = sheet.getRange(oneRepMaxSheetKey).getValue();
    const percentOfOneRepMax = weekWeightConfig.week[nextLiftWeek].sets[i].weight;

    const workoutSet = [
      nextLiftWeek,
      formatDateToMMDDYYYY(new Date()),
      liftName,
      // example: =FLOOR(K2*0.65, 5)
      `=FLOOR(${oneRepMax}*${percentOfOneRepMax}, 5)`,
      weekWeightConfig.week[nextLiftWeek].sets[i].restMinutes,
      weekWeightConfig.week[nextLiftWeek].sets[i].targetReps,
      0, // completed reps
      false, // completed
      weekWeightConfig.week[nextLiftWeek].sets[i].notes,
    ]

    console.log(`workoutSet: ${JSON.stringify(workoutSet)}`);

    sheet.appendRow(workoutSet);
   }
}

/**
 * Processes a specific column in the sheet.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet The sheet instance.
 */
function getNextLiftWeek(sheet: GoogleAppsScript.Spreadsheet.Sheet, liftName: string) {
  const exerciseNameIndex = getColumnIndex(sheet, "Exercise");
  const exerciseNameValues = sheet.getRange(1, exerciseNameIndex, sheet.getLastRow()).getValues();

  let indexOfExercise = -1;
  for(let i = 0; i<exerciseNameValues.length; i++){
    if(exerciseNameValues[i][0] === liftName){
      indexOfExercise = i;
    }
  }
  
  if(indexOfExercise === -1){
    return 1;
  }

  const exerciseWeekIndex = getColumnIndex(sheet, "Week");
  const exerciseWeekValue = sheet.getRange(indexOfExercise, exerciseWeekIndex, 1).getValue();
  
  return (exerciseWeekValue % 4) + 1;

}

function getColumnIndex(sheet: GoogleAppsScript.Spreadsheet.Sheet, columnName: string) {
  const headers = getHeaders(sheet);
  return headers.indexOf(columnName) + 1;
}

function getHeaders(sheet: GoogleAppsScript.Spreadsheet.Sheet) {
  const lastColumn = sheet.getLastColumn().valueOf();
  return sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
}

function formatDateToMMDDYYYY(date: Date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
}


interface OnEditEvent {
  authMode: string;
  oldValue: string;
  range: {
    columnEnd: number;
    columnStart: number;
    rowEnd: number;
    rowStart: number;
  }
  source: {
  }
  triggerUid: string;
  user: {
    email: string;
    nickname: string;
  }
  value: string;
}

function onEdit(e: GoogleAppsScript.Events.SheetsOnEdit) {

  // L8
  if(e.range.getColumn() === 12 && e.range.getRow() === 8){
    createNewWorkout();
  }

  syncCompletedReps(e);
}

function syncCompletedReps(e: GoogleAppsScript.Events.SheetsOnEdit) {
  const sheet = e.source.getActiveSheet();

  const expectedRepsIndex = getColumnIndex(sheet, "Expected Reps");
  const completedRepsIndex = getColumnIndex(sheet, "Completed Reps");
  const completedColumn = getColumnIndex(sheet, "Completed")
;
  const expectedReps = sheet.getRange(e.range.getRow(), expectedRepsIndex).getValue();
  const completedReps = sheet.getRange(e.range.getRow(), completedRepsIndex).getValue();

  if(e.range.getColumn() === completedRepsIndex && completedReps >= expectedReps){
    sheet.getRange(e.range.getRow(), completedColumn).setValue(true);
  }
  if(e.range.getColumn() === completedColumn && completedReps < expectedReps){
    sheet.getRange(e.range.getRow(), completedRepsIndex).setValue(expectedReps);
  }
}