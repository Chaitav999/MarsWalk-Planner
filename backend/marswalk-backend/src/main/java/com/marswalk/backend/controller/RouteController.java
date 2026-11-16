package com.marswalk.backend.controller;

import java.util.List;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.marswalk.backend.grid.GridCell;
import com.marswalk.backend.grid.GridLoader;
import com.marswalk.backend.service.AStarPathFinder;
import com.marswalk.backend.service.RouteMetricsCalculator;
import com.marswalk.backend.service.RouteMetricsCalculator.RouteMetrics;


@RestController
@RequestMapping ("/api/routes")
@CrossOrigin (origins="http://localhost:5173")
public class RouteController {
    
    private final GridLoader gridLoader;
    private final AStarPathFinder pathfinder;
    private final RouteMetricsCalculator metricsCalculator;

    public RouteController(GridLoader gridLoader, AStarPathFinder pathfinder, RouteMetricsCalculator metricsCalculator) {
        this.gridLoader = gridLoader;
        this.pathfinder = pathfinder;
        this.metricsCalculator = metricsCalculator;
    }

    @PostMapping
    public RouteResponse calculateRoute(@RequestBody RouteRequest request){
        
        int[][] grid = gridLoader.getGrid();

        List<GridCell> path = pathfinder.findPath(grid,gridLoader.getSlopeGrid(), request.start(), request.destination(), request.maxSlope());

        RouteMetrics metrics = metricsCalculator.calculate(path, grid, request.walkingSpeed());

        return new RouteResponse(path, metrics);
    }
    
}
