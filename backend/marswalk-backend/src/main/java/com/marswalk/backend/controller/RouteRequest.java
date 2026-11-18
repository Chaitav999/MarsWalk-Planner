package com.marswalk.backend.controller;

import java.util.List;

import com.marswalk.backend.grid.GridCell;

public record RouteRequest(GridCell start, GridCell destination, double maxSlope, double walkingSpeed, List<GridCell> waypoints) {
    
}
