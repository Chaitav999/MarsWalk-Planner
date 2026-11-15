package com.marswalk.backend.service;

import com.marswalk.backend.grid.GridCell;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class AStarPathFinder {
    
    private static final int[][] DIRECTIONS = {
        {-1, 0}, {1, 0}, {0, -1}, {0, 1},
        {-1, -1}, {-1, 1}, {1, -1}, {1, 1}
    };

    public List<GridCell> findPath(int[][] grid, GridCell start, GridCell goal){

        int rows = grid.length;
        int cols = grid[0].length;

        validateCell(start, rows, cols);
        validateCell(goal, rows, cols);

        Map<GridCell, Double> gScore = new HashMap<>();
        Map<GridCell, GridCell> cameFrom = new HashMap<>();

        PriorityQueue<GridCell> openSet = new PriorityQueue<>(Comparator.comparingDouble(
            cell -> gScore.getOrDefault(cell, Double.POSITIVE_INFINITY) + heuristic(cell, goal)
        ));

        gScore.put(start, 0.0);
        openSet.add(start);

        Set<GridCell> closedSet = new HashSet<>();

        while (!openSet.isEmpty()) {

            GridCell current = openSet.poll();

            if (current.equals(goal)) {
                return reconstructPath(cameFrom, current);
            }

            if (!closedSet.add(current)) {
                continue;
            }

            for (int[] direction : DIRECTIONS) {

                int newRow = current.row() + direction[0];
                int newCol = current.col() + direction[1];

                if (newRow < 0 || newRow >= rows || newCol < 0 || newCol >= cols) {
                    continue;
                }

                GridCell neighbor = new GridCell(newRow, newCol);

                if (closedSet.contains(neighbor)) {
                    continue;
                }

                boolean diagonal = direction[0] != 0 && direction[1] != 0;

                double distance = diagonal ? Math.sqrt(2) : 1.0;

                double movementCost = distance * grid[newRow][newCol];

                double tentativeG = gScore.get(current) + movementCost;

                if (tentativeG < gScore.getOrDefault(neighbor, Double.POSITIVE_INFINITY)) {

                    cameFrom.put(neighbor, current);
                    gScore.put(neighbor, tentativeG);
                    openSet.add(neighbor);
                }
            }
        }

        return Collections.emptyList();
    }

    private double heuristic(GridCell current, GridCell goal) {

        int dx = Math.abs(current.row() - goal.row());
        int dy = Math.abs(current.col() - goal.col());

        return Math.max(dx, dy) + (Math.sqrt(2) - 1) * Math.min(dx, dy);
    }

    private void validateCell(GridCell cell, int rows, int cols) {

        if (cell == null || cell.row() < 0 || cell.row() >= rows || cell.col() < 0 || cell.col() >= cols) {

            throw new IllegalArgumentException(
                "Start or destination is outside the terrain grid"
            );
        }
    }

    private List<GridCell> reconstructPath(Map<GridCell, GridCell> cameFrom, GridCell current) {

        List<GridCell> path = new ArrayList<>();

        while (current != null) {
            path.add(current);
            current = cameFrom.get(current);
        }

        Collections.reverse(path);
        return path;
    }
}

