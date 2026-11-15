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


@RestController
@RequestMapping ("/api/routes")
@CrossOrigin (origins="http://localhost:5173")
public class RouteController {
    
    private final GridLoader gridLoader;
    private final AStarPathFinder pathfinder;

    public RouteController(GridLoader gridLoader, AStarPathFinder pathfinder) {
        this.gridLoader = gridLoader;
        this.pathfinder = pathfinder;
    }

    @PostMapping
    public List<GridCell> calculateRoute(@RequestBody RouteRequest request){
        
        int[][] grid = gridLoader.getGrid();

        return pathfinder.findPath(grid, request.start(), request.destination());
    }
    
}
