let STARTING_POKER_CHIPS = 100;
let PLAYERS = 3;
let NO_OF_STARTING_CARDS = 2;
let gameHasEnded = false;

let playerOneName = "chloe";
let playerTwoName = "Jasmine";
let playerThreeName = "Jen";

console.log(`Welcome! 챔피언십 타이틀은 ${playerOneName},
    ${playerTwoName}, ${playerThreeName} 중 한 명에게 주어집니다. 각
    선수는 ${STARTING_POKER_CHIPS} 의 칩을 가지고 시작합니다. 흥미진진한 
    경기가 될것입니다. 최고의 선수가 승리하길 바랍니다!`);

let playerOnePoints = STARTING_POKER_CHIPS;
let playerTwoPoints = STARTING_POKER_CHIPS;
let playerThreePoints = STARTING_POKER_CHIPS;

playerOnePoints -= 50;
playerTwoPoints -= 25;
playerThreePoints += 75;

gameHasEnded = ((playerOnePoints + playerTwoPoints) == 0) ||
                ((playerTwoPoints + playerThreePoints) == 0) ||
                ((playerOnePoints + playerThreePoints) == 0 );

console.log("게임이 종료되었습니다." , gameHasEnded);