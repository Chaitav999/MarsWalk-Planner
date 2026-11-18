package com.marswalk.backend.controller;

import java.util.ArrayList;
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
        double[][] slopeGrid = gridLoader.getSlopeGrid();

        List<GridCell> targets = new ArrayList<>();

        if(request.waypoints() != null){
            targets.addAll(request.waypoints());
        }

        targets.add(request.destination());

        List<GridCell> completePath = new ArrayList<>();

        GridCell currentPosition = request.start();

        for(GridCell target : targets){

            List<GridCell> segment = pathfinder.findPath(grid, slopeGrid, currentPosition, target, request.maxSlope());

            if(segment.isEmpty()){
                completePath.clear();
                break;
            }

            if(completePath.isEmpty()){
                completePath.addAll(segment);
            } else{
                completePath.addAll(segment.subList(1, segment.size()));
            }

            currentPosition = target;
        }



        RouteMetrics metrics = metricsCalculator.calculate(completePath, grid, request.walkingSpeed());

        return new RouteResponse(completePath, metrics);
    }
    
}
