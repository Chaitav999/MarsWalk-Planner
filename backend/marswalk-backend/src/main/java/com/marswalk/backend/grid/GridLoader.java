package com.marswalk.backend.grid;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;

import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

@Component 
public class GridLoader implements CommandLineRunner {

    private int[][] grid;
    private double[][] slopeGrid;

    @Override
    public void run(String... args) throws Exception {
        loadGrid();
        loadSlopeGrid();
        System.out.println("Terrain grid loaded: " + grid.length + " x " + grid[0].length);
        System.out.println("Slope grid loaded: " + slopeGrid.length + " x " + slopeGrid[0].length);
    }

    private void loadGrid() throws IOException {
        
        List<int[]> rows = new ArrayList<>();

        ClassPathResource resource = new ClassPathResource("terrain_cost.csv");

        try(BufferedReader reader = new BufferedReader(new InputStreamReader(resource.getInputStream()))){

            String line;

            while((line = reader.readLine()) != null){

                String[] values = line.split(",");
                int[] row = new int[values.length];

                for(int i = 0; i < values.length; i++){
                    row[i] = Integer.parseInt(values[i].trim());
                }

                rows.add(row);
            }
        }

        if(rows.size() != 40){
            throw new IllegalStateException("Expected 40 rows");
        }

        int columns = rows.get(0).length;

        if(columns != 40){
            throw new IllegalStateException("Expected 40 columns");
        }

        grid = rows.toArray(new int[0][]);
    }

    public int[][] getGrid(){
        return grid;
    }
    public double[][] getSlopeGrid() {
    return slopeGrid;
}

    private void loadSlopeGrid() throws IOException{
        
        List<double[]> rows = new ArrayList<>();

        ClassPathResource resource = new ClassPathResource("slope.csv");

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(resource.getInputStream()))) {

            String line;

            while ((line = reader.readLine()) != null) {

                String[] values = line.split(",");
                double[] row = new double[values.length];

                for (int i = 0; i < values.length; i++) {
                    row[i] = Double.parseDouble(values[i].trim());
                }

                rows.add(row);
            }
        }

        if (rows.size() != 40 || rows.get(0).length != 40) {
            throw new IllegalStateException("Expected a 40 x 40 slope grid");
        }

        slopeGrid = rows.toArray(new double[0][]);
    }
    
}
