module.exports = {
    requires: {
        bundle: "ai"
    },
    run: [
        {
            method: "shell.run",
            params: {
                message: [
                    "git clone https://github.com/6Morpheus6/TRELLIS.2 app --recursive",
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
                    "uv pip install wheel setuptools imageio imageio-ffmpeg tqdm easydict opencv-python-headless ninja trimesh transformers gradio==5.50.0 tensorboard pandas lpips zstandard kornia timm plyfile numpy"
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
        // Step 6: Detect GPU architecture and set TORCH_CUDA_ARCH_LIST
        {
            when: "{{gpu === 'nvidia'}}",
            method: "shell.run",
            params: {
                venv: "venv",
                path: "app",
                message: [
                    "python -c \"import torch; cc = torch.cuda.get_device_capability(); print('CUDA_ARCH:' + str(cc[0]) + '.' + str(cc[1]))\""
                ]
            }
        },
        // Step 6b: Set the CUDA architecture environment variable
        {
            when: "{{gpu === 'nvidia'}}",
            method: "local.set",
            params: {
                cuda_arch: "{{input.stdout.match(/CUDA_ARCH:(\\d+\\.\\d+)/)?.[1] || '8.9'}}"
            }
        },
        // Step 7: Clone nvdiffrast (CUDA only)
        {
            when: "{{gpu === 'nvidia' && !exists('extensions/nvdiffrast')}}",
            method: "shell.run",
            params: {
                message: [
                    "git clone -b v0.4.0 https://github.com/NVlabs/nvdiffrast.git extensions/nvdiffrast"
                ]
            }
        },
        // Step 8: Install nvdiffrast
        {
            when: "{{gpu === 'nvidia'}}",
            method: "shell.run",
            params: {
                venv: "venv",
                path: "app",
                build: true,
                env: {
                    TORCH_CUDA_ARCH_LIST: "{{local.cuda_arch}}"
                },
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
                env: {
                    TORCH_CUDA_ARCH_LIST: "{{local.cuda_arch}}"
                },
                message: [
                    "uv pip install ../extensions/nvdiffrec --no-build-isolation"
                ]
            }
        },
        {
            when: "{{platform === 'win32'}}",
            method: "shell.run",
            params: {
                venv: "venv",
                path: "app",
                message: [
                    "uv pip install ../wheels/cumesh-0.0.1-cp310-cp310-win_amd64.whl",
                    "uv pip install ../wheels/flex_gemm-0.0.1-cp310-cp310-win_amd64.whl",
                    "uv pip install ../wheels/o_voxel-0.0.1-cp310-cp310-win_amd64.whl --no-build-isolation --no-deps"
                ]
            }
        },
        // Step 10: Clone CuMesh
        {
            when: "{{gpu === 'nvidia' && !exists('extensions/CuMesh') && platform !== 'win32'}}",
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
                    "git apply --check ../../patches/cumesh_atlas.patch 2>/dev/null && git apply ../../patches/cumesh_atlas.patch || echo 'CuMesh atlas patch skipped (already applied or not needed)'",
                    "git apply --check ../../patches/cumesh_setup.patch 2>/dev/null && git apply ../../patches/cumesh_setup.patch || echo 'CuMesh setup patch skipped (already applied or not needed)'"
                ]
            }
        },
        // // Step 11b: Apply CuMesh patch (Windows)
        // {
        //     when: "{{gpu === 'nvidia' && platform === 'win32'}}",
        //     method: "shell.run",
        //     params: {
        //         path: "extensions/CuMesh",
        //         message: [
        //             "git apply --check ../../patches/cumesh_atlas.patch 2>NUL && git apply ../../patches/cumesh_atlas.patch && echo CuMesh atlas patch applied || echo CuMesh atlas patch skipped",
        //             "git apply --check ../../patches/cumesh_setup.patch 2>NUL && git apply ../../patches/cumesh_setup.patch && echo CuMesh setup patch applied || echo CuMesh setup patch skipped"
        //         ]
        //     }
        // },
        // Step 12: Install CuMesh
        {
            when: "{{gpu === 'nvidia' && platform !== 'win32'}}",
            method: "shell.run",
            params: {
                venv: "venv",
                path: "app",
                build: true,
                env: {
                    TORCH_CUDA_ARCH_LIST: "{{local.cuda_arch}}"
                },
                message: [
                    "uv pip install ../extensions/CuMesh --no-build-isolation"
                ]
            }
        },
        // Step 13: Clone FlexGEMM
        {
            when: "{{gpu === 'nvidia' && !exists('extensions/FlexGEMM') && platform !== 'win32'}}",
            method: "shell.run",
            params: {
                message: [
                    "git clone https://github.com/JeffreyXiang/FlexGEMM.git extensions/FlexGEMM --recursive"
                ]
            }
        },
        // Step 13b: Apply FlexGEMM setup patch
        {
            when: "{{gpu === 'nvidia' && exists('extensions/FlexGEMM') && platform !== 'win32'}}",
            method: "shell.run",
            params: {
                path: "extensions/FlexGEMM",
                message: [
                    "git apply --check ../../patches/flexgemm_setup.patch 2>NUL && git apply ../../patches/flexgemm_setup.patch || echo FlexGEMM setup patch skipped"
                ]
            }
        },
        // Step 14: Install FlexGEMM
        {
            when: "{{gpu === 'nvidia' && platform !== 'win32'}}",
            method: "shell.run",
            params: {
                venv: "venv",
                path: "app",
                build: true,
                env: {
                    TORCH_CUDA_ARCH_LIST: "{{local.cuda_arch}}"
                },
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
        // // Step 15b: Copy o-voxel to extensions directory (Windows)
        // {
        //     when: "{{gpu === 'nvidia' && platform === 'win32' && !exists('extensions/o-voxel')}}",
        //     method: "shell.run",
        //     params: {
        //         message: [
        //             "xcopy /E /I /Y app\\o-voxel extensions\\o-voxel"
        //         ]
        //     }
        // },

        // Step 16: Apply o-voxel patches (Linux/macOS)
        {
            when: "{{gpu === 'nvidia' && platform !== 'win32'}}",
            method: "shell.run",
            params: {
                path: "extensions/o-voxel",
                message: [
                    "patch -p1 --forward < ../../patches/ovoxel_pyproject.patch || true",
                    "patch -p1 --forward < ../../patches/ovoxel_pr59.patch || true",
                    "patch -p1 --forward < ../../patches/ovoxel_pr60.patch || true",
                    "patch -p1 --forward < ../../patches/ovoxel_pr61.patch || true",
                    "patch -p1 --forward < ../../patches/ovoxel_setup.patch || true"
                ]
            }
        },
        // // Step 16b: Apply o-voxel patches (Windows)
        // {
        //     when: "{{gpu === 'nvidia' && platform === 'win32'}}",
        //     method: "shell.run",
        //     params: {
        //         path: "extensions/o-voxel",
        //         message: [
        //             "patch -p1 --forward < ../../patches/ovoxel_pyproject.patch || echo patch skipped",
        //             "patch -p1 --forward < ../../patches/ovoxel_pr59.patch || echo patch skipped",
        //             "patch -p1 --forward < ../../patches/ovoxel_pr60.patch || echo patch skipped",
        //             "patch -p1 --forward < ../../patches/ovoxel_pr61.patch || echo patch skipped",
        //             "patch -p1 --forward < ../../patches/ovoxel_setup.patch || echo patch skipped"
        //         ]
        //     }
        // },
        // Step 17: Install o-voxel from extensions directory
        {
            when: "{{gpu === 'nvidia' && platform !== 'win32'}}",
            method: "shell.run",
            params: {
                venv: "venv",
                path: "app",
                build: true,
                env: {
                    TORCH_CUDA_ARCH_LIST: "{{local.cuda_arch}}"
                },
                message: [
                    "uv pip install ../extensions/o-voxel --no-build-isolation"
                ]
            }
        },
        // // Step 18: Check HuggingFace authentication status
        // // Run hf auth whoami and capture the result - if it fails, user is not authenticated
        // // Using unique markers to avoid confusion with command echo
        // {
        //     when: "{{platform !== 'win32'}}",
        //     method: "shell.run",
        //     params: {
        //         venv: "venv",
        //         path: "app",
        //         message: [
        //             "hf auth whoami > /dev/null 2>&1 && echo 'HF_AUTH_YES' || echo 'HF_AUTH_NO'"
        //         ]
        //     }
        // },
        // {
        //     when: "{{platform === 'win32'}}",
        //     method: "shell.run",
        //     params: {
        //         venv: "venv",
        //         path: "app",
        //         message: [
        //             "hf auth whoami >NUL 2>&1 && echo HF_AUTH_YES || echo HF_AUTH_NO"
        //         ]
        //     }
        // },
        // // Step 19: Store auth status in local variable based on shell output
        // {
        //     method: "local.set",
        //     params: {
        //         hf_authenticated: "{{input.stdout.includes('HF_AUTH_YES')}}"
        //     }
        // },
        // // Step 20: Jump based on authentication status
        // {
        //     method: "jump",
        //     params: {
        //         id: "{{local.hf_authenticated ? 'hf_auth_done' : 'download_mirrors'}}"
        //     }
        // },
        // Download models from mirrors (unauthenticated users)
        // {
        //     id: "download_mirrors",
        //     method: "log",
        //     params: {
        //         text: "*** Not authenticated with HuggingFace - downloading models from mirrors ***"
        //     }
        // },
        
        // Download DINOv3 from mirror
        {
            method: "shell.run",
            params: {
                path: "app",
                message: 'hf download camenduru/dinov3-vitl16-pretrain-lvd1689m --exclude="License.md" --exclude=".gitattributes" --exclude="README.md"'
            }
        },
        // Rename DINOv3 model directory  (Linux/macOS)
        {
            when: "{{platform !== 'win32'}}",
            method: "shell.run",
            params: {
                path: "./cache/HF_HOME/hub",
                message: "mv models--camenduru--dinov3-vitl16-pretrain-lvd1689m models--facebook--dinov3-vitl16-pretrain-lvd1689m 2>/dev/null || true"
            }
        },
        // Rename DINOv3 model directory (Windows)
        {
            when: "{{platform === 'win32'}}",
            method: "shell.run",
            params: {
                path: "./cache/HF_HOME/hub",
                message: "ren models--camenduru--dinov3-vitl16-pretrain-lvd1689m models--facebook--dinov3-vitl16-pretrain-lvd1689m"
            }
        },
        // Download RMBG-2.0 from mirror
        {
            method: "shell.run",
            params: {
                path: "app",
                message: 'hf download camenduru/RMBG-2.0 --exclude=".gitattributes" --exclude="README.md"'
            }
        },
        // Rename RMBG-2.0  model directory (Linux)
        {
            when: "{{platform !== 'win32'}}",
            method: "shell.run",
            params: {
                path: "./cache/HF_HOME/hub",
                message: "mv models--camenduru--RMBG-2.0 models--briaai--RMBG-2.0 2>/dev/null || true"
            }
        },
        // Rename RMBG-2.0 model directory (Windows)
        {
            when: "{{platform === 'win32'}}",
            method: "shell.run",
            params: {
                path: "./cache/HF_HOME/hub",
                message: "ren models--camenduru--RMBG-2.0 models--briaai--RMBG-2.0"
            }
        },
        // // Authenticated users skip to here
        // {
        //     id: "hf_auth_done",
        //     method: "log",
        //     params: {
        //         text: "*** HuggingFace authentication check complete ***"
        //     }
        // },
        // Final step: Notify completion
        {
            method: "log",
            params: {
                text: "Installation complete! You can now start the application."
            }
        }
    ]
}
