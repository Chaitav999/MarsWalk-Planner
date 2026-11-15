import numpy as np
import matplotlib.pyplot as plt

data = np.fromfile("data/mola/megt00n090hb.img", dtype=">i2").reshape((5632, 11520))

#target coordinates
target_lat = -5.46
target_lon = 137.71

#converts coordinates to raster indices
row = round((0 - target_lat) * 128)
col = round(11520.5 + (target_lon - 180) * 128) - 1

#extracts the regional elevation data
elevation = data[row-20:row+20, col-20:col+20]
print("Elevation minimum:", elevation.min())
print("Elevation maximum:", elevation.max())
print("Missing or special values:", np.sum(elevation == -32768))

#calculates the approximate pixel size in metres
mars_radius = 3396000

pixel_size_y = (mars_radius * np.pi) / (180 * 128)
pixel_size_x = pixel_size_y * np.cos(np.radians(target_lat))

# calculates elevation change in both directions
dz_dy, dz_dx = np.gradient(elevation.astype(float), pixel_size_y, pixel_size_x)

slope = np.degrees(np.arctan(np.sqrt(dz_dx**2 + dz_dy**2)))

terrain_cost = np.ones_like(slope, dtype=int)

#assigns higher costs to steeper terrain
terrain_cost[(slope >= 10) & (slope <=20)] = 3
terrain_cost[slope > 20] = 8

#counts cells in each terrain category
low_cost = np.sum(terrain_cost == 1)
medium_cost = np.sum(terrain_cost == 3)
high_cost = np.sum(terrain_cost == 8)

print("Low-cost cells:", low_cost)
print("Medium-cost cells:", medium_cost)
print("High-cost cells:", high_cost)

# displays the terrain cost grid
plt.figure(figsize=(10, 7))

cost_map = plt.imshow(
    terrain_cost,
    cmap="RdYlGn_r",
    origin="upper",
    vmin=1,
    vmax=8
)

# saves the terrain cost grid
np.savetxt(
    "data/mola/terrain_cost.csv",
    terrain_cost,
    delimiter=",",
    fmt="%d"
)

#saves slope angle
np.savetxt(
    "data/mola/slope.csv",
    slope,
    delimiter=",",
    fmt="%.4f"
)

print("Terrain cost grid exported successfully.")

plt.colorbar(cost_map, label="Terrain cost")

plt.title("MOLA Terrain Cost Grid — Nevado Sajama")
plt.xlabel("East-West pixels")
plt.ylabel("North-South pixels")

plt.tight_layout()
plt.savefig("data/mola/sajama_terrain_cost.png", dpi=150)
plt.show()



print("Slope minimum:", round(float(slope.min()), 2), "degrees")
print("Slope maximum:", round(float(slope.max()), 2), "degrees")
print("Slope average:", round(float(slope.mean()), 2), "degrees")

from matplotlib.colors import ListedColormap

# Create a clean terrain difficulty overlay
colors = ListedColormap([
    "#22c55e",  # Low cost
    "#eab308",  # Medium cost
    "#ef4444"   # High cost
])

plt.figure(figsize=(8, 8))

plt.imshow(terrain_cost, cmap=colors, interpolation="nearest", origin="upper", vmin=1, vmax=8)

plt.axis("off")

plt.savefig("data/mola/terrain_overlay.png", transparent=True, bbox_inches="tight", pad_inches=0)

plt.close()

print("Terrain overlay exported successfully.")