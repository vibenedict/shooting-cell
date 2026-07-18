// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "@contracts/ShooterScore.sol";

contract ShooterScoreTest is Test {
    ShooterScore public game;

    address alice = address(0xA11CE);
    address bob = address(0xB0B);

    function setUp() public {
        game = new ShooterScore();
    }

    function testSubmitFirstScore() public {
        vm.prank(alice);
        game.submitScore(10);
        assertEq(game.bestScore(alice), 10);
    }

    function testRevertsOnLowerScore() public {
        vm.startPrank(alice);
        game.submitScore(10);
        vm.expectRevert(ShooterScore.NotNewBest.selector);
        game.submitScore(5);
        vm.stopPrank();
    }

    function testUpdatesOnHigherScore() public {
        vm.startPrank(alice);
        game.submitScore(10);
        game.submitScore(20);
        vm.stopPrank();
        assertEq(game.bestScore(alice), 20);
    }

    function testLeaderboardSortedDescending() public {
        vm.prank(alice);
        game.submitScore(10);
        vm.prank(bob);
        game.submitScore(30);

        ShooterScore.Entry[10] memory lb = game.getLeaderboard();
        assertEq(lb[0].player, bob);
        assertEq(lb[0].score, 30);
        assertEq(lb[1].player, alice);
        assertEq(lb[1].score, 10);
    }

    function testPlayerImprovingScoreBubblesUp() public {
        vm.prank(alice);
        game.submitScore(10);
        vm.prank(bob);
        game.submitScore(30);
        vm.prank(alice);
        game.submitScore(40);

        ShooterScore.Entry[10] memory lb = game.getLeaderboard();
        assertEq(lb[0].player, alice);
        assertEq(lb[0].score, 40);
        assertEq(lb[1].player, bob);
        assertEq(lb[1].score, 30);
    }

    function testLeaderboardCapsAtTenEntries() public {
        for (uint256 i = 0; i < 11; i++) {
            address player = address(uint160(i + 1));
            vm.prank(player);
            game.submitScore((i + 1) * 10);
        }

        ShooterScore.Entry[10] memory lb = game.getLeaderboard();
        // Highest score submitted was 110 (i=10), lowest kept should be 20 (i=1 excluded)
        assertEq(lb[0].score, 110);
        assertEq(lb[9].score, 20);
    }
}
