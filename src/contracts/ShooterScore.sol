// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ShooterScore
 * @notice On-chain high score leaderboard for the Celo Shooter arcade game.
 *         Anyone can submit a score; it's only recorded if it beats their own
 *         previous best. The top MAX_ENTRIES scores across all players are
 *         kept sorted descending in a fixed-size array.
 * @dev    No token/fee involved — pure score submission, gas-only. Leaderboard
 *         updates are O(MAX_ENTRIES) per call, so cost is bounded and cheap.
 */
contract ShooterScore {
    uint256 public constant MAX_ENTRIES = 10;

    struct Entry {
        address player;
        uint256 score;
    }

    // Best score ever submitted per address.
    mapping(address => uint256) public bestScore;

    // Sorted descending, index 0 = highest score. Empty slots are zero-valued.
    Entry[MAX_ENTRIES] private leaderboard;

    event ScoreSubmitted(address indexed player, uint256 score);

    error NotNewBest();

    /// @notice Submit a run's score. Reverts if it doesn't beat your prior best.
    function submitScore(uint256 score) external {
        if (score <= bestScore[msg.sender]) revert NotNewBest();
        bestScore[msg.sender] = score;
        _insertLeaderboard(msg.sender, score);
        emit ScoreSubmitted(msg.sender, score);
    }

    /// @notice Returns the current top-10 leaderboard, sorted descending.
    function getLeaderboard() external view returns (Entry[MAX_ENTRIES] memory) {
        return leaderboard;
    }

    function _insertLeaderboard(address player, uint256 score) internal {
        // If the player already has an entry, update it in place and bubble up.
        for (uint256 i = 0; i < MAX_ENTRIES; i++) {
            if (leaderboard[i].player == player) {
                leaderboard[i].score = score;
                _bubbleUp(i);
                return;
            }
        }

        // Otherwise, only insert if it beats the current lowest entry
        // (or that slot is still empty).
        uint256 lastIdx = MAX_ENTRIES - 1;
        if (leaderboard[lastIdx].player != address(0) && score <= leaderboard[lastIdx].score) {
            return;
        }

        leaderboard[lastIdx] = Entry({player: player, score: score});
        _bubbleUp(lastIdx);
    }

    function _bubbleUp(uint256 idx) internal {
        while (idx > 0 && leaderboard[idx].score > leaderboard[idx - 1].score) {
            Entry memory tmp = leaderboard[idx - 1];
            leaderboard[idx - 1] = leaderboard[idx];
            leaderboard[idx] = tmp;
            idx--;
        }
    }
}
