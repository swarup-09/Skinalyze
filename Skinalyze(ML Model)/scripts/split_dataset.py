import os, shutil, random

original_dataset_dir = r"D:\ML Project TY- 2025\Skin Cancer Dataset"
base_dir = r"D:\ML Project TY- 2025\skin_disease_project\dataset_split"

split_ratio = {
    'train': 0.7,
    'val': 0.15,
    'test': 0.15
}

if os.path.exists(base_dir):
    shutil.rmtree(base_dir)


for split in split_ratio:
    for category in os.listdir(original_dataset_dir):
        os.makedirs(os.path.join(base_dir, split, category), exist_ok=True)

# Filter img and split
for category in os.listdir(original_dataset_dir):
    path = os.path.join(original_dataset_dir, category)
    images = [f for f in os.listdir(path) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
    print(f"🔍 {category}: {len(images)} valid images found.")

    random.shuffle(images)
    train_cut = int(split_ratio['train'] * len(images))
    val_cut = int(split_ratio['val'] * len(images)) + train_cut

    train_files = images[:train_cut]
    val_files = images[train_cut:val_cut]
    test_files = images[val_cut:]

    for file in train_files:
        shutil.copy(os.path.join(path, file), os.path.join(base_dir, 'train', category, file))
    for file in val_files:
        shutil.copy(os.path.join(path, file), os.path.join(base_dir, 'val', category, file))
    for file in test_files:
        shutil.copy(os.path.join(path, file), os.path.join(base_dir, 'test', category, file))

print("Dataset split complete.")
