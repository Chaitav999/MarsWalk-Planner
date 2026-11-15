package com.marswalk.backend.controller;

import java.util.List;

import com.marswalk.backend.grid.GridCell;
import com.marswalk.backend.service.RouteMetricsCalculator.RouteMetrics;

public record RouteResponse(List<GridCell> path, RouteMetrics metrics) {
    
}
