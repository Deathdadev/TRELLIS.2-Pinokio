# TRELLIS.2 for Pinokio

A one-click installer for [Microsoft/TRELLIS.2](https://github.com/microsoft/TRELLIS.2) on Pinokio.

This script automates the complex setup process for TRELLIS, including:
- Setting up a Conda environment / Virtual Environment.
- Installing optimized dependencies (Pillow-SIMD).
- Compiling and installing necessary CUDA extensions:
    - `nvdiffrast`
    - `nvdiffrec`
    - `CuMesh`
    - `FlexGEMM`
    - `o-voxel`
- Applying necessary patches for Windows compatibility.

## Installation

1.  **Install Pinokio**: Download and install [Pinokio](https://pinokio.computer/).
2.  **Load Script**: Open this script in Pinokio.
3.  **Click Install**: Run the installer. It will handle cloning, patching, and building all dependencies.

**Note**: The installation process may take some time as it involves compiling several CUDA extensions.

## Usage

Once installed, you can start the application directly from Pinokio:

- **Open Web UI**: Starts the Gradio interface specifically.
- **Start**: Runs the application (`python app.py`).
- **Terminal**: Opens a terminal in the application directory.

## Features

- **Automated Patching**: Automatically patches `CuMesh` and `o-voxel` for Windows compatibility.
- **Optimized**: Installs `pillow-simd` for faster image processing.
- **GPU Acceleration**: Fully configured for NVIDIA GPUs with all required custom ops.

## Credits

- [Microsoft/TRELLIS.2](https://github.com/microsoft/TRELLIS.2) - The original TRELLIS project.
- [Deathdadev/TRELLIS.2-Windows](https://github.com/Deathdadev/TRELLIS.2-Windows) - My forked version of the TRELLIS project with similar fixes to the pull requests below;
- **Upstream Fixes referenced:**
    - [PR #59: Fix MSVC build (remove GCC-only 'd' suffix)](https://github.com/microsoft/TRELLIS.2/pull/59)
    - [PR #60: Fix MSVC narrowing conversion errors](https://github.com/microsoft/TRELLIS.2/pull/60)
    - [PR #61: Fix GPU timeout on large meshes](https://github.com/microsoft/TRELLIS.2/pull/61)

## Citation

```bibtex
@article{
    xiang2025trellis2,
    title={Native and Compact Structured Latents for 3D Generation},
    author={Xiang, Jianfeng and Chen, Xiaoxue and Xu, Sicheng and Wang, Ruicheng and Lv, Zelong and Deng, Yu and Zhu, Hongyuan and Dong, Yue and Zhao, Hao and Yuan, Nicholas Jing and Yang, Jiaolong},
    journal={Tech report},
    year={2025}
}
```
