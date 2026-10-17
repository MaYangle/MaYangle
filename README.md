**Applied AI/ML engineer in Jiangsu, China.** I work on multimodal learning —
fusing text, audio and video for sentiment and affect — and on industrial AI at
Mettler Toledo.

My standing question on any fusion result is whether the fusion earned its keep,
or whether the gain came from extra pretraining. Answering it honestly usually
means reporting numbers worse than the ones in the paper.

## Current work

**[Multimodal-Sentiment-Fusion](https://github.com/MaYangle/Multimodal-Sentiment-Fusion)**
— native continuous sentiment prediction on CH-SIMS v2.0 and CMU-MOSEI. Frozen
MacBERT, WavLM and DINOv2 streams fused by 8-query multi-key cross-attention
across three layers, with a feature-conditioned routing policy applied after
normalisation. 2,084,871 trainable parameters.

> On CH-SIMS v2 VALID (647 clips, seeds 13/42/2026) the current candidate scores
> **0.3785 ± 0.0075 MAE** against **0.3788 ± 0.0073** for static sequence fusion,
> and fails its preregistered all-seed gain requirement. The seven matched
> controls, the failure analysis and the negative result stay in the repository.

Architecture, the 27-cell gate matrix and both evaluation protocols are written
up in [`docs/`](https://github.com/MaYangle/Multimodal-Sentiment-Fusion/tree/main/docs).
Datasets and checkpoints are not redistributed; the CPU demo runs on synthetic
inputs.

## Upstream contributions

**[Bilingual-Multimodal-Sentiment-Analysis](https://github.com/19376357/Bilingual-Multimodal-Sentiment-Analysis)**
— six merged pull requests on training and inference reliability:
regression/classification dtype mismatches, `batch_size=1` output shapes,
NaN/Inf prediction handling, missing-face feature shapes, and cross-platform
result loading. Followed by bilingual documentation and a licensing pass.

**[ai-engineering-from-scratch](https://github.com/rohitg00/ai-engineering-from-scratch)**
— lesson quizzes, a README i18n audit across twelve translations, and research
links for seven lessons.

## Tooling

Python · PyTorch · Hugging Face Transformers · WavLM · MacBERT · DINOv2 ·
Whisper · NumPy · pytest · GitHub Actions

## Contact

[LinkedIn](https://www.linkedin.com/in/yangle-ma-84877a294/) ·
[yanglema44@gmail.com](mailto:yanglema44@gmail.com)
