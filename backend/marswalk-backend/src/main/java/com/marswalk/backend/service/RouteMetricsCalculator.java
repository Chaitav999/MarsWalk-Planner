package com.marswalk.backend.service;

import java.util.List;

import org.springframework.stereotype.Component;

import com.marswalk.backend.grid.GridCell;

@Component 
public class RouteMetricsCalculator {
    
    private static final double MARS_RADIUS = 3396190.0;
    private static final double GRID_CELL_DEGREES = 1.0 / 128.0;

    private static final double WALKING_SPEED_METERS_PER_SECOND = 1.0;

     public RouteMetrics calculate(List<GridCell> path, int[][] grid) {

        if (path == null || path.isEmpty()) {
            return new RouteMetrics(0, 0, 0);
        }

        double distanceMeters = 0;
        double terrainCost = 0;

        for (int i = 0; i < path.size(); i++) {

            GridCell current = path.get(i);

            terrainCost += grid[current.row()][current.col()];

            if (i > 0) {
                GridCell previous = path.get(i - 1);

                double rowDifference = Math.abs(current.row() - previous.row());

                double colDifference = Math.abs(current.col() - previous.col());

                double northSouthDistance = rowDifference * MARS_RADIUS * Math.toRadians(GRID_CELL_DEGREES);

                double eastWestDistance = colDifference * MARS_RADIUS * Math.cos(Math.toRadians(-5.46)) * Math.toRadians(GRID_CELL_DEGREES);

                distanceMeters += Math.sqrt(northSouthDistance * northSouthDistance + eastWestDistance * eastWestDistance);
            }
        }

        double walkingMinutes = distanceMeters / WALKING_SPEED_METERS_PER_SECOND / 60.0;

        return new RouteMetrics(distanceMeters, walkingMinutes, terrainCost);
    }

    public record RouteMetrics(double distanceMeters,double walkingMinutes,double terrainCost) {}
}
