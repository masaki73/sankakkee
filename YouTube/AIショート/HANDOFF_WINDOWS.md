# AIショート制作：Windows引き継ぎ

更新日：2026-10-14

## このプロジェクトのゴール

横動画「内製化について」の文字起こしをもとに、白シャツの出演者をローカルAIで再現した30秒の縦型ショートを作り、本編へ誘導する。

- AI出演者：白シャツの主話者
- 尺：30秒
- CTA：YouTubeの関連動画
- 誘導先：https://youtu.be/lglhHtKFy-I?si=jQshzAKLSUOCoTGs
- AI利用同意：ユーザー確認済み（2026-10-14）
- 採用企画：「編集まで内製化すると失敗する」
- 台本と画面構成：`ショート企画案_内製化.md`
- 機械可読の仕様：`short_brief_内製化.json`

YouTube企画の作り方は、AIがたたき台を作り、人が事実・表現・ブランド適合性を最終判断する前提とする。

## GitHubに入れるもの／入れないもの

GitHubには、次だけを保存する。

- Markdown、JSON、文字起こし、PowerShellスクリプト
- 制作方針、台本、素材のファイル名・サイズ・SHA-256

次はGitHubへ入れない。

- 元動画、学習候補動画、生成動画・音声
- AIモデルの重み
- GPT-SoVITS、MuseTalkなどのローカルインストール一式

動画は大きく、通常のGit管理に不向きである。外付けSSD、同一LAN共有、またはクラウドストレージでWindowsへ移す。`.gitignore`で誤登録を防止している。

外付けSSDへ安全に書き出す場合は、Macで保存先を指定して次を実行できる。既存ファイルのハッシュが異なる場合は上書きせず停止する。

```bash
bash scripts/export_media_macos.sh /Volumes/SSD_NAME/ai-short-assets
```

## 素材の現在地

Mac上ではこのフォルダ直下に素材がある。Windowsでは素材だけを、たとえば次へコピーする。

```text
D:\ai-short-assets\
├── 20260730_Acam_Hayasi_1465.MP4
├── avatar_training_candidate_white_1465_150-190.mp4
├── avatar_training_candidate_white_880-915.mp4
├── voice_reference_white_1465_150-160.wav
└── 内製化について.mp4
```

`内製化について.txt`は小さいためGitで引き継ぐ。素材の正確なサイズとハッシュは`asset_manifest.json`に記録している。

正式なAI素材は`20260730_Acam_Hayasi_1465.MP4`。白シャツ本人のみのカットなし映像で、1920×1080、約3分39秒、PCM音声。最初の生成テストには、そこから切り出した`avatar_training_candidate_white_1465_150-190.mp4`を使う。

声の初回参照には`voice_reference_white_1465_150-160.wav`を使う。無音の少ない10秒、PCM 48kHz mono。参照音声の発話テキストは、Windows側のGPT-SoVITS内蔵ASRで起こして目視修正してから入力する。

## Windowsでの手順

### 1. GitHubからプロジェクトを取得

GitHubへの保存後、WindowsでPowerShellを開き、任意の作業フォルダへcloneする。現在は親リポジトリ`masaki73/sankakkee`内のプロジェクトである。

```powershell
git clone https://github.com/masaki73/sankakkee.git C:\work\sankakkee
Set-Location 'C:\work\sankakkee\YouTube\AIショート'
```

### 2. 動画素材を別経路でコピー

外付けSSDなどから`D:\ai-short-assets`へコピーし、環境変数を設定する。

```powershell
$env:AI_SHORT_ASSETS_ROOT = 'D:\ai-short-assets'
[Environment]::SetEnvironmentVariable('AI_SHORT_ASSETS_ROOT', $env:AI_SHORT_ASSETS_ROOT, 'User')
```

ドライブがCだけなら`C:\ai-short-assets`でもよい。モデルや動画のため、空き容量は最低40GB、できれば80GB以上を確保する。

### 3. 素材を照合

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\verify_assets.ps1
```

全項目が`OK`ならMacとWindowsの素材は同一。初回は数GBを読み取るため少し時間がかかる。

### 4. Windowsの性能を確認

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\check_windows.ps1
```

結果のうち、特にGPU名、VRAM、NVIDIAドライバー、空き容量を確認する。

### 5. ローカルAIの置き場所を準備

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\setup_windows.ps1 -PrepareDirectories -CloneTools
```

このスクリプトはフォルダ作成と公式リポジトリのcloneまで行う。Python依存関係やモデルは、GPU診断後に各公式インストーラーで入れる。削除や既存フォルダの上書きはしない。

## 推奨するローカル構成

### NVIDIA GPUがあり、VRAM 8GB以上

- 声：GPT-SoVITS
- 口パク：MuseTalk 1.5
- 最初は40秒候補映像でテストし、30秒の完成台本へ進む

### NVIDIA GPUがあり、VRAM 4〜6GB

- GPT-SoVITSを使用
- MuseTalkは`--use_float16`で短いテストから始める
- 容量不足や不安定さがあれば、口パクのみSadTalkerへ切り替える

### NVIDIA GPUがない

- GPT-SoVITSはCPU経路を試せるが処理時間は長くなる
- MuseTalkの実用運用は避け、SadTalkerまたはクラウド生成を比較する

MuseTalk公式はWindowsの4GB VRAM環境でもfp16動作例を示しているが、8秒生成に約5分という目安であり、GPUごとの差が大きい。まず8秒で顔・口・声を確認してから30秒を生成する。

## GPT-SoVITSの導入方針

`C:\ai-tools\GPT-SoVITS`で、公式の`install.ps1`を使う。GPU診断後にデバイスを選ぶ。

```powershell
conda create -n GPTSoVits python=3.10 -y
conda activate GPTSoVits
Set-Location C:\ai-tools\GPT-SoVITS

# NVIDIA/CUDA環境の例。CU126かCU128かは診断後に決める。
pwsh -F .\install.ps1 -Device CU126 -Source HF

# NVIDIAを使わない場合
# pwsh -F .\install.ps1 -Device CPU -Source HF
```

CUDA版を推測で選ばない。Windows側で`nvidia-smi`とPyTorch対応を確認してから決める。

## MuseTalkの導入方針

`C:\ai-tools\MuseTalk`で、公式READMEのWindows手順に従う。公式はPython 3.10、PyTorch 2.0.1系、FFmpegを案内している。重みはリポジトリ付属の`download_weights.bat`で取得する。

```powershell
conda create -n MuseTalk python=3.10 -y
conda activate MuseTalk
Set-Location C:\ai-tools\MuseTalk
```

以降のPyTorch/CUDA導入はGPU診断結果に合わせる。古い固定コマンドを無条件で実行せず、公式READMEの現在の手順を優先する。

## 最初の検証単位

いきなり30秒を完成させず、次の順で品質を見る。

1. `voice_reference_white_1465_150-160.wav`をGPT-SoVITSの参照音声にし、内蔵ASRの文字起こしを目視修正
2. GPT-SoVITSで完成台本の冒頭8秒だけ音声生成
3. MuseTalkへ`avatar_training_candidate_white_1465_150-190.mp4`と8秒音声を入力
4. 顔の同一性、歯・口元、瞬き、声の類似、ノイズを確認
5. 問題があれば参照音声、bbox shift、fp16設定を1項目ずつ調整
6. 合格後に30秒版を生成
7. Premiere Proでテロップ、Bロール、関連動画CTAを仕上げる

## WindowsのCodexへ渡す最初の依頼文

CodexでWindowsホストと`C:\work\sankakkee`を選び、新しいチャットに次を送る。

```text
YouTube/AIショート/HANDOFF_WINDOWS.md、asset_manifest.json、short_brief_内製化.jsonを読み、scripts/check_windows.ps1を実行してください。GPU・VRAM・空き容量を報告し、その結果に合うGPT-SoVITSとMuseTalkの導入方法を確定してください。素材はAI_SHORT_ASSETS_ROOTにあり、最初は8秒だけ生成テストを行ってください。元動画は変更せず、生成物はYouTube/AIショート/outputsへ保存してください。
```

Codexは選択したWindowsホスト上で処理を実行するため、チャット開始時にホストとワークスペースをWindows側へ切り替える。

## 公式資料

- Codexのホスト／ワークスペース選択：https://developers.openai.com/blog/mastering-codex-remote-for-engineering
- GPT-SoVITS：https://github.com/RVC-Boss/GPT-SoVITS
- MuseTalk：https://github.com/TMElyralab/MuseTalk
- SadTalker：https://github.com/OpenTalker/SadTalker

各AIツールは更新が速いため、依存関係のインストール時点では上記READMEを正とする。この資料に固定したバージョン情報と食い違う場合、公式READMEを優先する。

## 完了条件

- 8秒テストで本人らしい声と破綻の少ない口パクを確認
- 30秒版を1080×1920で書き出し
- 冒頭3秒で主張が伝わる
- 最後に「判断基準は関連動画で解説しています」と発話・表示
- YouTube Studioで関連動画に`lglhHtKFy-I`を設定
- AI生成物であることの表示・社内ルール・本人同意条件を満たす

