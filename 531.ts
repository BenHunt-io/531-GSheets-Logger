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
    "barbell_bench_press": "L3",
    "overhead_press": "L4",
    "bulgarian_split_squat": "L5",
    "deadlift": "L6",
    "squat": "L7",
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

function createNew531WorkoutSets(){
   
  const{ nextLiftWeek, oneRepMax, liftName, sheet } = get531WorkoutConfig();

   for(let i = 0; i<3; i++){
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

    sheet.appendRow(workoutSet);
   }
}

function get531WorkoutConfig(){
  const fiveThreeOneSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("531 Exercises");
  if(!fiveThreeOneSheet){
    throw new Error("531 Sheet not found");
  }
  const liftName = fiveThreeOneSheet.getRange("L2").getValue().toLowerCase().replace(/ /g, "_");
  const nextLiftWeek = getNextLiftWeek(fiveThreeOneSheet, liftName);

  const oneRepMaxSheetKey = weekWeightConfig.OneRepMaxSheetKey[liftName];
  console.log(`oneRepMaxSheetKey: ${oneRepMaxSheetKey}, liftName: ${liftName}`);
  const oneRepMax = fiveThreeOneSheet.getRange(oneRepMaxSheetKey).getValue();

  return {
    sheet: fiveThreeOneSheet,
    liftName,
    nextLiftWeek,
    oneRepMax,
  }
}

function createAccessoryWorkoutSets(){

  const sheet = SpreadsheetApp.getActiveSpreadsheet();
  const {nextLiftWeek} = get531WorkoutConfig();
  const liftName = sheet.getRange("L2").getValue();
  const numSets = Number(sheet.getRange("L3").getValue());

  for(let i = 0; i<numSets; i++){
    const workoutSet = [
      nextLiftWeek - 1, // assuming main 531 lift already completed today
      formatDateToMMDDYYYY(new Date()),
      liftName,
      0, // weight
      1, // rest
      8, // reps
      0, // completed reps
      false, // completed
      "", // notes
    ]

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

function onEdit(e: GoogleAppsScript.Events.SheetsOnEdit) {

  switch(e.source.getActiveSheet().getSheetName()){
    case "531 Exercises":
      // L8 - create new 531 workout if "start workout" checkbox was toggled
      if(e.range.getColumn() === 12 && e.range.getRow() === 8){
        createNew531WorkoutSets();
      }
      break;
    case "Accessory Exercises": 
      // L3 - create new accessory workout if "Create sets" checkbox was toggled
      if(e.range.getColumn() === 12 && e.range.getRow() === 4){
        createAccessoryWorkoutSets();
      }
      // L9 - add new lift to dropdown menu
      if(e.range.getColumn() === 12 && e.range.getRow() === 9){
        addNewLiftToDropdownMenu(e);
      }
      break;
  }
  
  syncCompletedReps(e);
}

function addNewLiftToDropdownMenu(e: GoogleAppsScript.Events.SheetsOnEdit) {
  const sheet = e.source.getActiveSheet();
  const liftDropDownMenuCell = sheet.getRange("L2");
  const liftDropDownMenu = liftDropDownMenuCell.getDataValidation();
  if(!liftDropDownMenu){
    throw new Error("Lift dropdown menu not found");
  }
  const lifts = liftDropDownMenu.getCriteriaValues()[0];
  const newLiftName = sheet.getRange("L8").getValue();
  if(!lifts.includes(newLiftName)){
    lifts.push(newLiftName);
  }
  const newLiftDropDownMenu = SpreadsheetApp.newDataValidation()
    .requireValueInList(lifts, true)
    .build();

  liftDropDownMenuCell.setDataValidation(newLiftDropDownMenu);
  
}

function syncCompletedReps(e: GoogleAppsScript.Events.SheetsOnEdit) {
  const sheet = e.source.getActiveSheet();

  const expectedRepsIndex = getColumnIndex(sheet, "Expected Reps");
  const completedRepsIndex = getColumnIndex(sheet, "Completed Reps");
  const completedIndex = getColumnIndex(sheet, "Completed");
  const expectedReps = sheet.getRange(e.range.getRow(), expectedRepsIndex).getValue();
  const completedReps = sheet.getRange(e.range.getRow(), completedRepsIndex).getValue();
  const completed = Boolean(sheet.getRange(e.range.getRow(), completedIndex).getValue());

  if(e.range.getColumn() === completedRepsIndex && completedReps >= expectedReps){
    sheet.getRange(e.range.getRow(), completedIndex).setValue(true);
  }
  else if(e.range.getColumn() === completedIndex && completed && completedReps < expectedReps){
    sheet.getRange(e.range.getRow(), completedRepsIndex).setValue(expectedReps);
  }
  else if(e.range.getColumn() === completedRepsIndex && completed && completedReps < expectedReps){
    sheet.getRange(e.range.getRow(), completedIndex).setValue(false);
  }
}
