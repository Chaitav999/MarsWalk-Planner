package com.marswalk.backend.controller;

import com.marswalk.backend.grid.GridCell;

public record RouteRequest(GridCell start, GridCell destination, double maxSlope) {
    
}
