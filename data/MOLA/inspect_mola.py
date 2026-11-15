
import numpy as np
import matplotlib.pyplot as plt

#reads the MOLA elevation raster
data = np.fromfile(
    "data/mola/megt00n090hb.img",
    dtype=">i2"
).reshape((5632, 11520))

print("Raster shape:", data.shape)

#provisional target coordinates
target_lat = -5.46
target_lon = 137.71


#converts coordinates to raster indices
row = round((0 - target_lat) * 128)
col = round(11520.5 + (target_lon - 180) * 128) - 1

print("target row: ", row)
print("target col: ", col)


#extracts a 40 x 40 pixel region
region = data[row-20:row+20, col-20:col+20]

print("Region shape:", region.shape)
print("Minimum:", region.min(), "m")
print("Maximum:", region.max(), "m")
print("Mean:", round(float(region.mean()), 2), "m")


#calculates geographic boundaries
pixel_size = 1 / 128

west = target_lon - 20 * pixel_size
east = target_lon + 20 * pixel_size
south = target_lat - 20 * pixel_size
north = target_lat + 20 * pixel_size


#plots the elevation map
plt.figure(figsize=(10, 7))

elevation_map = plt.imshow(region, cmap="terrain", extent=[west, east, south, north], origin="upper", aspect="equal")

plt.scatter(target_lon, target_lat, color="red", marker="x", s=100, label="Provisional target")

plt.colorbar(elevation_map, label="Elevation (metres)")
plt.xlabel("East Longitude (degrees)")
plt.ylabel("Latitude (degrees)")
plt.title("MOLA Elevation — Nevado Sajama Region")
plt.legend()

plt.tight_layout()
plt.savefig("data/mola/sajama_elevation.png", dpi=150)
plt.show()
