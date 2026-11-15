package com.marswalk.backend.service;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import org.junit.jupiter.api.Test;

import com.marswalk.backend.grid.GridCell;

class AStarPathFinderTest {

    @Test
    void shouldAvoidExpensiveTerrain() {

        int[][] grid = new int[5][5];

        //Initialize all cells with normal terrain cost
        for (int row = 0; row < 5; row++) {
            for (int col = 0; col < 5; col++) {

                grid[row][col] = 1;
            }
        }

        //Add expensive terrain in the direct route
        grid[2][1] = 8;
        grid[2][2] = 8;
        grid[2][3] = 8;

        AStarPathFinder pathfinder = new AStarPathFinder();

        GridCell start = new GridCell(2, 0);
        GridCell goal = new GridCell(2, 4);

        List<GridCell> path = pathfinder.findPath(grid, start, goal);

        assertFalse(path.isEmpty());
        assertEquals(start, path.get(0));
        assertEquals(goal, path.get(path.size() - 1));

        assertFalse(path.contains(new GridCell(2, 1)));
        assertFalse(path.contains(new GridCell(2, 2)));
        assertFalse(path.contains(new GridCell(2, 3)));
    }
}
