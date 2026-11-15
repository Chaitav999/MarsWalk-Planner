
package com.marswalk.backend.service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.PriorityQueue;
import java.util.Set;

import org.springframework.stereotype.Component;

import com.marswalk.backend.grid.GridCell;

@Component
public class AStarPathFinder {

    private static final int[][] DIRECTIONS = {
        {-1, 0}, {1, 0}, {0, -1}, {0, 1},
        {-1, -1}, {-1, 1}, {1, -1}, {1, 1}
    };

    //Immutable entry: scores cannot change after insertion.
    private record QueueEntry(GridCell cell, double gScore, double fScore) {}

    public List<GridCell> findPath(int[][] grid, double[][] slopeGrid, GridCell start, GridCell goal, double maxSlope) {

        int rows = grid.length;
        int cols = grid[0].length;

        validateCell(start, rows, cols);
        validateCell(goal, rows, cols);

        if (slopeGrid[start.row()][start.col()] > maxSlope || slopeGrid[goal.row()][goal.col()] > maxSlope) {
            
            return Collections.emptyList();
        }

        Map<GridCell, Double> gScore = new HashMap<>();
        Map<GridCell, GridCell> cameFrom = new HashMap<>();

        PriorityQueue<QueueEntry> openSet = new PriorityQueue<>(Comparator.comparingDouble(QueueEntry::fScore));

        gScore.put(start, 0.0);

        openSet.add(new QueueEntry(start, 0.0, heuristic(start, goal)));

        Set<GridCell> closedSet = new HashSet<>();

        while (!openSet.isEmpty()) {

            QueueEntry entry = openSet.poll();
            GridCell current = entry.cell();

            // Ignore outdated queue entries.
            if (entry.gScore() > gScore.getOrDefault(current, Double.POSITIVE_INFINITY)){
                continue;
            }

            if (current.equals(goal)){
                return reconstructPath(cameFrom, current);
            }

            if (!closedSet.add(current)){
                continue;
            }

            for (int[] direction : DIRECTIONS){

                int newRow = current.row() + direction[0];
                int newCol = current.col() + direction[1];

                if (newRow < 0 || newRow >= rows || newCol < 0 || newCol >= cols){
                    continue;
                }

                GridCell neighbor = new GridCell(newRow, newCol);

                if (closedSet.contains(neighbor)){
                    continue;
                }
                if (slopeGrid[newRow][newCol] > maxSlope) {
                    continue;
                }

                boolean diagonal = direction[0] != 0 && direction[1] != 0;

                double distance = diagonal ? Math.sqrt(2) : 1.0;

                double movementCost = distance * grid[newRow][newCol];

                double tentativeG = gScore.get(current) + movementCost;

                if (tentativeG < gScore.getOrDefault(neighbor, Double.POSITIVE_INFINITY)){

                    cameFrom.put(neighbor, current);
                    gScore.put(neighbor, tentativeG);

                    double fScore = tentativeG + heuristic(neighbor, goal);

                    openSet.add(new QueueEntry(neighbor, tentativeG, fScore));
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

        if (cell == null || cell.row() < 0 || cell.row() >= rows || cell.col() < 0 || cell.col() >= cols){

            throw new IllegalArgumentException("Start or destination is outside the terrain grid");
        }
    }

    private List<GridCell> reconstructPath(Map<GridCell, GridCell> cameFrom, GridCell current){

        List<GridCell> path = new ArrayList<>();

        while (current != null) {
            path.add(current);
            current = cameFrom.get(current);
        }

        Collections.reverse(path);
        return path;
    }
}
