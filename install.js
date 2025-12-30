module.exports = {
    run: [
        {
            method: "shell.run",
            params: {
                message: [
                    "git clone https://github.com/microsoft/TRELLIS.2.git app --recursive",
                ]
            }
        },
        // // Step 1: Install conda dependencies for pillow-simd
        // {
        //     when: "{{platform !== 'darwin'}}",
        //     method: "shell.run",
        //     params: {
        //         conda: {
        //             path: "trellis2_env",
        //             python: "python=3.10"
        //         },
        //         path: "app",
        //         message: [
        //             "conda install -y zlib libjpeg-turbo libwebp -c conda-forge"
        //         ]
        //     }
        // },
        // Step 2: Install PyTorch and dependencies via torch.js
        {
            method: "script.start",
            params: {
                uri: "torch.js",
                params: {
                    path: "app",
                    venv: "venv",
                    xformers: true,
                    triton: true,
                    flashattention: true
                }
            }
        },
        // Step 3: Install basic Python dependencies
        {
            method: "shell.run",
            params: {
                venv: "venv",
                path: "app",
                message: [
                    "uv pip install wheel setuptools hf_xet imageio imageio-ffmpeg tqdm easydict opencv-python-headless ninja trimesh transformers gradio==6.0.1 tensorboard pandas lpips zstandard kornia timm plyfile numpy"
                ]
            }
        },
        // Step 4: Install utils3d from git
        {
            method: "shell.run",
            params: {
                venv: "venv",
                path: "app",
                message: [
                    "uv pip install git+https://github.com/EasternJournalist/utils3d.git@9a4eb15e4021b67b12c460c7057d642626897ec8"
                ]
            }
        },
        // Step 5a: Install pillow-simd (Windows - Custom Wheel)
        {
            when: "{{platform === 'win32'}}",
            method: "shell.run",
            params: {
                venv: "venv",
                path: "app",
                message: [
                    "uv pip install https://github.com/Deathdadev/pillow-simd/releases/download/v9.5.0.post2/pillow_simd-9.5.0.post2-cp310-cp310-win_amd64.whl"
                ]
            }
        },
        // Step 5b: Install pillow-simd (Linux - Custom Wheel)
        {
            when: "{{platform === 'linux'}}", // explicitly linux, not generic !darwin just in case
            method: "shell.run",
            params: {
                venv: "venv",
                path: "app",
                message: [
                    "uv pip install https://github.com/Deathdadev/pillow-simd/releases/download/v9.5.0.post2/pillow_simd-9.5.0.post2-cp310-cp310-manylinux_2_27_x86_64.manylinux_2_28_x86_64.whl"
                ]
            }
        },
        // Step 6: Clone nvdiffrast (CUDA only)
        {
            when: "{{gpu === 'nvidia' && !exists('extensions/nvdiffrast')}}",
            method: "shell.run",
            params: {
                message: [
                    "git clone -b v0.4.0 https://github.com/NVlabs/nvdiffrast.git extensions/nvdiffrast"
                ]
            }
        },
        // Step 7: Install nvdiffrast
        {
            when: "{{gpu === 'nvidia'}}",
            method: "shell.run",
            params: {
                venv: "venv",
                path: "app",
                build: true,
                message: [
                    "uv pip install ../extensions/nvdiffrast --no-build-isolation"
                ]
            }
        },
        // Step 8: Clone nvdiffrec (CUDA only)
        {
            when: "{{gpu === 'nvidia' && !exists('extensions/nvdiffrec')}}",
            method: "shell.run",
            params: {
                message: [
                    "git clone -b renderutils https://github.com/JeffreyXiang/nvdiffrec.git extensions/nvdiffrec"
                ]
            }
        },
        // Step 9: Install nvdiffrec
        {
            when: "{{gpu === 'nvidia'}}",
            method: "shell.run",
            params: {
                venv: "venv",
                path: "app",
                build: true,
                message: [
                    "uv pip install ../extensions/nvdiffrec --no-build-isolation"
                ]
            }
        },
        // Step 10: Clone CuMesh
        {
            when: "{{gpu === 'nvidia' && !exists('extensions/CuMesh')}}",
            method: "shell.run",
            params: {
                message: [
                    "git clone https://github.com/JeffreyXiang/CuMesh.git extensions/CuMesh --recursive"
                ]
            }
        },
        // Step 11: Apply CuMesh patch (Linux)
        {
            when: "{{gpu === 'nvidia' && platform !== 'win32'}}",
            method: "shell.run",
            params: {
                path: "extensions/CuMesh",
                message: [
                    "git apply --check ../../patches/cumesh_atlas.patch 2>/dev/null && git apply ../../patches/cumesh_atlas.patch || echo 'CuMesh patch skipped (already applied or not needed)'"
                ]
            }
        },
        // Step 11b: Apply CuMesh patch (Windows)
        {
            when: "{{gpu === 'nvidia' && platform === 'win32'}}",
            method: "shell.run",
            params: {
                path: "extensions/CuMesh",
                message: [
                    "git apply --check ../../patches/cumesh_atlas.patch 2>NUL && git apply ../../patches/cumesh_atlas.patch && echo CuMesh patch applied || echo CuMesh patch skipped"
                ]
            }
        },
        // Step 12: Install CuMesh
        {
            when: "{{gpu === 'nvidia'}}",
            method: "shell.run",
            params: {
                venv: "venv",
                path: "app",
                build: true,
                message: [
                    "uv pip install ../extensions/CuMesh --no-build-isolation"
                ]
            }
        },
        // Step 13: Clone FlexGEMM
        {
            when: "{{gpu === 'nvidia' && !exists('extensions/FlexGEMM')}}",
            method: "shell.run",
            params: {
                message: [
                    "git clone https://github.com/JeffreyXiang/FlexGEMM.git extensions/FlexGEMM --recursive"
                ]
            }
        },
        // Step 14: Install FlexGEMM
        {
            when: "{{gpu === 'nvidia'}}",
            method: "shell.run",
            params: {
                venv: "venv",
                path: "app",
                build: true,
                message: [
                    "uv pip install ../extensions/FlexGEMM --no-build-isolation"
                ]
            }
        },
        // Step 15: Copy o-voxel to extensions directory (Linux/macOS)
        {
            when: "{{gpu === 'nvidia' && platform !== 'win32' && !exists('extensions/o-voxel')}}",
            method: "shell.run",
            params: {
                message: [
                    "cp -r app/o-voxel extensions/o-voxel"
                ]
            }
        },
        // Step 15b: Copy o-voxel to extensions directory (Windows)
        {
            when: "{{gpu === 'nvidia' && platform === 'win32' && !exists('extensions/o-voxel')}}",
            method: "shell.run",
            params: {
                message: [
                    "xcopy /E /I /Y app\\o-voxel extensions\\o-voxel"
                ]
            }
        },

        // Step 16: Apply o-voxel patches (Linux/macOS)
        {
            when: "{{gpu === 'nvidia' && platform !== 'win32'}}",
            method: "shell.run",
            params: {
                path: "extensions/o-voxel",
                message: [
                    "git apply --check ../../patches/ovoxel_pyproject.patch 2>/dev/null && git apply ../../patches/ovoxel_pyproject.patch || echo 'pyproject patch skipped'",
                    "git apply --check ../../patches/ovoxel_pr59.patch 2>/dev/null && git apply ../../patches/ovoxel_pr59.patch || echo 'PR59 patch skipped'",
                    "git apply --check ../../patches/ovoxel_pr60.patch 2>/dev/null && git apply ../../patches/ovoxel_pr60.patch || echo 'PR60 patch skipped'",
                    "git apply --check ../../patches/ovoxel_pr61.patch 2>/dev/null && git apply ../../patches/ovoxel_pr61.patch || echo 'PR61 patch skipped'"
                ]
            }
        },
        // Step 16b: Apply o-voxel patches (Windows)
        {
            when: "{{gpu === 'nvidia' && platform === 'win32'}}",
            method: "shell.run",
            params: {
                path: "extensions/o-voxel",
                message: [
                    "git apply --check ../../patches/ovoxel_pyproject.patch 2>NUL && git apply ../../patches/ovoxel_pyproject.patch && echo pyproject patch applied || echo pyproject patch skipped",
                    "git apply --check ../../patches/ovoxel_pr59.patch 2>NUL && git apply ../../patches/ovoxel_pr59.patch && echo PR59 patch applied || echo PR59 patch skipped",
                    "git apply --check ../../patches/ovoxel_pr60.patch 2>NUL && git apply ../../patches/ovoxel_pr60.patch && echo PR60 patch applied || echo PR60 patch skipped",
                    "git apply --check ../../patches/ovoxel_pr61.patch 2>NUL && git apply ../../patches/ovoxel_pr61.patch && echo PR61 patch applied || echo PR61 patch skipped"
                ]
            }
        },
        // Step 17: Install o-voxel from extensions directory
        {
            when: "{{gpu === 'nvidia'}}",
            method: "shell.run",
            params: {
                venv: "venv",
                path: "app",
                build: true,
                message: [
                    "uv pip install ../extensions/o-voxel --no-build-isolation"
                ]
            }
        },
        // Final step: Notify completion
        {
            method: "log",
            params: {
                text: "Installation complete! You can now start the application."
            }
        }
    ]
}
