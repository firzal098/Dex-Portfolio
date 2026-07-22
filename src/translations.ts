export type Language = "en" | "id" | "ja";

export interface TranslationSet {
  title: string;
  subtitle: string;
  beginJourney: string;
  menuHome: string;
  menuTelemetry: string;
  menuSkills: string;
  menuExperiences: string;
  menuProjects: string;
  menuContact: string;
  
  // Introduction Section
  introTitle: string;
  introText: string;
  introAbout: string;
  
  // Drone Telemetry Section
  telemetryTitle: string;
  telemetrySubtitle: string;
  telemetryArmed: string;
  telemetryDisarmed: string;
  telemetryState: string;
  telemetryAlt: string;
  telemetrySpeed: string;
  telemetryHeading: string;
  telemetryPitch: string;
  telemetryRoll: string;
  telemetryYaw: string;
  telemetryControls: string;
  telemetryArmBtn: string;
  telemetryDisarmBtn: string;
  telemetryFlightMode: string;
  telemetryPidTuning: string;
  telemetryTerminalTitle: string;
  telemetryCameraTitle: string;
  telemetryCameraSub: string;
  telemetryYoloStatus: string;
  telemetryLocalMap: string;
  telemetryGateDist: string;
  
  // Skills Section
  skillsTitle: string;
  skillsSubtitle: string;
  skillsCategoryLang: string;
  skillsCategoryRobotics: string;
  skillsCategoryWeb: string;
  skillsCategoryDesign: string;
  skillsCategoryHardware: string;
  skillsCategoryDatabase: string;
  
  // Experience Section
  expTitle: string;
  expSubtitle: string;
  expGameDev: string;
  expGameDevDesc: string;
  expRoboticsDesc: string;
  expDockerDesc: string;
  
  // Projects Section
  projectsTitle: string;
  projectsSubtitle: string;
  projectResponseLondonRole: string;
  projectResponseLondonDesc: string;
  projectGasingBladeRole: string;
  projectGasingBladeDesc: string;
  visitProject: string;
  
  // Contact Section
  contactTitle: string;
  contactSubtitle: string;
  contactName: string;
  contactEmail: string;
  contactSubject: string;
  contactMessage: string;
  contactSendBtn: string;
  contactSending: string;
  contactSuccess: string;
  contactError: string;
  contactPlaceholderName: string;
  contactPlaceholderEmail: string;
  contactPlaceholderSubject: string;
  contactPlaceholderMessage: string;
  contactUplinkStatus: string;
  contactMessagesTitle: string;
  contactNoMessages: string;
}

export const translations: Record<Language, TranslationSet> = {
  en: {
    title: "CHRONICLES OF PERCEPTION",
    subtitle: "GAME DEVELOPER, AI ENGINEER & TACTICAL DRONE ARCHITECT",
    beginJourney: "BEGIN YOUR JOURNEY",
    menuHome: "OVERVIEW",
    menuTelemetry: "TELEMETRY",
    menuSkills: "SKILLS MATRIX",
    menuExperiences: "EXPERIENCE",
    menuProjects: "PROJECTS",
    menuContact: "CONTACT",
    
    introTitle: "FIRZAL",
    introText: "A sophomore student at Ahmad Dahlan University with a deep passion for Computer Vision, Game Development, and Artificial Intelligence.",
    introAbout: "Designing autonomous airborne architectures, integrating neural network models on edge-computing silicon, and simulating real-time environment perception. Focused on bridging the gap between hardware actuators and deep reinforcement learning algorithms.",
    
    telemetryTitle: "KING PHOENIX PANEL",
    telemetrySubtitle: "TACTICAL DRONE CONTROL PANEL & AI PERCEPTION",
    telemetryArmed: "ACTIVE",
    telemetryDisarmed: "INACTIVE",
    telemetryState: "DRONE TELEMETRY STATE",
    telemetryAlt: "ALTITUDE",
    telemetrySpeed: "SPEED",
    telemetryHeading: "HEADING",
    telemetryPitch: "PITCH",
    telemetryRoll: "ROLL",
    telemetryYaw: "YAW",
    telemetryControls: "MANUAL OVERRIDES",
    telemetryArmBtn: "START MOTORS",
    telemetryDisarmBtn: "STOP MOTORS",
    telemetryFlightMode: "FLIGHT MODE",
    telemetryPidTuning: "PID CONTROLLER TUNING",
    telemetryTerminalTitle: "DRONE DEBUG TERMINAL",
    telemetryCameraTitle: "FRONT CAMERA (YOLO DETECTION)",
    telemetryCameraSub: "OBJECT DETECTION & TARGET ACQUISITION IN REAL-TIME",
    telemetryYoloStatus: "YOLO PERCEPTION ACTIVE",
    telemetryLocalMap: "RELATIVE TARGET MAP SYSTEM",
    telemetryGateDist: "DISTANCE TO TARGET",
    
    skillsTitle: "TECHNICAL SKILLS",
    skillsSubtitle: "ENGINEERING STACK & CAPABILITIES",
    skillsCategoryLang: "PROGRAMMING LANGUAGES",
    skillsCategoryRobotics: "ROBOTICS & SIMULATORS",
    skillsCategoryWeb: "FRONTEND & BACKEND",
    skillsCategoryDesign: "CREATIVE & DESIGN Tools",
    skillsCategoryHardware: "HARDWARE & SILICON",
    skillsCategoryDatabase: "STORAGE & DATABASES",
    
    expTitle: "PROFESSIONAL EXPERIENCE",
    expSubtitle: "CHRONOLOGICAL ARCHIVE OF RESEARCH & DEVELOPMENT",
    expGameDev: "Game Development",
    expGameDevDesc: "Over 7 years of specialized development in Roblox Studio using Luau. Architecting multiplayer systems with high-density physical optimizations. Experienced in modular setups with Godot and Unity engines.",
    expRoboticsDesc: "Simulating physical interactions in Webots, Gazebo, and MuJoCo. Training autonomous flight controllers using Stable Baselines 3 and Gymnasium environments. Integrating YOLO Bounding Box and Pose Estimation for Computer Vision. Operating over ROS Jazzy frameworks, MAVLink APIs, and flashing ArduPilot firmwares.",
    expDockerDesc: "Isolating complex simulation environments, service backends, and deployment sandboxes into lightweight Docker containers for reproducible edge computing.",
    
    projectsTitle: "PROJECT DEPLOYMENTS",
    projectsSubtitle: "ACTIVE MULTIPLAYER PROJECTS",
    projectResponseLondonRole: "Core Gameplay & Systems Developer",
    projectResponseLondonDesc: "An immersive emergency response simulation capturing complex real-world operations, urban scale physics, and advanced tactical team networking.",
    projectGasingBladeRole: "Lead System Architect & Mechanics Designer",
    projectGasingBladeDesc: "A high-octane physics-based competitive spinning-top combat arena utilizing complex Luau constraints, custom collision solvers, and client-side interpolation.",
    visitProject: "OPEN SIMULATION",
    
    contactTitle: "CONTACT ME",
    contactSubtitle: "GET IN TOUCH",
    contactName: "YOUR NAME",
    contactEmail: "EMAIL ADDRESS",
    contactSubject: "SUBJECT",
    contactMessage: "MESSAGE",
    contactSendBtn: "SEND MESSAGE",
    contactSending: "SENDING MESSAGE...",
    contactUplinkStatus: "CONNECTION SECURE",
    contactSuccess: "Your message has been sent successfully. Thank you!",
    contactError: "There was an error sending your message. Please try again.",
    contactPlaceholderName: "Enter your name...",
    contactPlaceholderEmail: "you@example.com",
    contactPlaceholderSubject: "Enter message subject...",
    contactPlaceholderMessage: "Write your message here...",
    contactMessagesTitle: "RECEIVED MESSAGES",
    contactNoMessages: "No messages received yet. Send one below!"
  },
  id: {
    title: "KRONIK PERSEPSI",
    subtitle: "GAME DEVELOPER, AI ENGINEER & TACTICAL DRONE ARCHITECT",
    beginJourney: "MULAI PERJALANAN",
    menuHome: "IKHTISAR",
    menuTelemetry: "TELEMETRI",
    menuSkills: "MATRIKS KEAHLIAN",
    menuExperiences: "PENGALAMAN",
    menuProjects: "PROYEK",
    menuContact: "KONTAK",
    
    introTitle: "FIRZAL",
    introText: "Mahasiswa tahun kedua di Universitas Ahmad Dahlan dengan ketertarikan mendalam pada Computer Vision, Pengembangan Game, dan Kecerdasan Buatan.",
    introAbout: "Merancang arsitektur airborne otonom, mengintegrasikan model jaringan saraf pada silikon komputasi tepi (edge computing), dan mensimulasikan persepsi lingkungan real-time. Berfokus menjembatani kesenjangan antara aktuator perangkat keras dan algoritma reinforcement learning.",
    
    telemetryTitle: "PANEL KING PHOENIX",
    telemetrySubtitle: "PANEL KONTROL DRONE TAKTIS & PERSEPSI AI",
    telemetryArmed: "AKTIF",
    telemetryDisarmed: "NONAKTIF",
    telemetryState: "KONDISI TELEMETRI DRONE",
    telemetryAlt: "KETINGGIAN",
    telemetrySpeed: "KECEPATAN",
    telemetryHeading: "ARAH (HEADING)",
    telemetryPitch: "PITCH",
    telemetryRoll: "ROLL",
    telemetryYaw: "YAW",
    telemetryControls: "MANUAL OVERRIDES",
    telemetryArmBtn: "AKTIFKAN MOTOR",
    telemetryDisarmBtn: "MATIKAN MOTOR",
    telemetryFlightMode: "MODE PENERBANGAN",
    telemetryPidTuning: "TUNING PENGENDALI PID",
    telemetryTerminalTitle: "TERMINAL DEBUG DRONE",
    telemetryCameraTitle: "KAMERA DEPAN (PERSEPSI YOLO)",
    telemetryCameraSub: "DETEKSI OBJEK & AKUISISI TARGET SECARA REAL-TIME",
    telemetryYoloStatus: "MATRIKS PERSEPSI YOLO AKTIF",
    telemetryLocalMap: "SISTEM PETA RELATIF TARGET",
    telemetryGateDist: "JARAK KE TARGET",
    
    skillsTitle: "KEAHLIAN TEKNIS",
    skillsSubtitle: "TEKNOLOGI & KEMAMPUAN TEKNIK",
    skillsCategoryLang: "BAHASA PEMROGRAMAN",
    skillsCategoryRobotics: "ROBOTIKA & SIMULATOR",
    skillsCategoryWeb: "FRONTEND & BACKEND",
    skillsCategoryDesign: "ALAT DESAIN & KREATIF",
    skillsCategoryHardware: "PERANGKAT KERAS & SILIKON",
    skillsCategoryDatabase: "PENYIMPANAN & DATABASE",
    
    expTitle: "PENGALAMAN PROFESIONAL",
    expSubtitle: "ARSIP KRONOLOGIS PENELITIAN & PENGEMBANGAN",
    expGameDev: "Pengembangan Game",
    expGameDevDesc: "Lebih dari 7 tahun pengembangan khusus di Roblox Studio menggunakan bahasa Luau. Merancang sistem multipemain dengan optimasi fisik kepadatan tinggi. Berpengalaman dengan alur kerja modular di mesin game Godot dan Unity.",
    expRoboticsDesc: "Mensimulasikan interaksi fisik di Webots, Gazebo, dan MuJoCo. Melatih model panduan otonom menggunakan Stable Baselines 3 dan lingkungan Gymnasium. Mengintegrasikan YOLO Bounding Box dan Pose Estimation untuk Computer Vision. Menjalankan pengendali robot di atas framework ROS Jazzy, API MAVLink, dan mem-flash firmware ArduPilot.",
    expDockerDesc: "Mengisolasi framework simulasi kompleks, layanan backend, dan sandbox deployment ke dalam lapisan kontainer ringan Docker untuk komputasi tepi yang dapat direproduksi.",
    
    projectsTitle: "PROYEK SEKTOR",
    projectsSubtitle: "TEMPAT KERJA MULTIPEMAIN AKTIF",
    projectResponseLondonRole: "Pengembang Gameplay & Sistem Utama",
    projectResponseLondonDesc: "Sebuah simulasi tanggap darurat mendalam yang menangkap operasi dunia nyata yang kompleks, fisik skala perkotaan, dan jaringan tim taktis canggih.",
    projectGasingBladeRole: "Arsitek Sistem Utama & Perancang Mekanik",
    projectGasingBladeDesc: "Arena pertempuran gasing kompetitif berbasis fisika otonom menggunakan batasan Luau yang kompleks, pemecah tabrakan kustom, dan interpolasi sisi klien.",
    visitProject: "BUKA SIMULASI",
    
    contactTitle: "HUBUNGI SAYA",
    contactSubtitle: "KIRIM PESAN",
    contactName: "NAMA ANDA",
    contactEmail: "ALAMAT EMAIL",
    contactSubject: "SUBJEK",
    contactMessage: "PESAN",
    contactSendBtn: "KIRIM PESAN",
    contactSending: "Mengirim pesan...",
    contactUplinkStatus: "KONEKSI AMAN",
    contactSuccess: "Pesan Anda berhasil dikirim. Terima kasih!",
    contactError: "Terjadi kesalahan saat mengirim pesan. Silakan coba lagi.",
    contactPlaceholderName: "Masukkan nama Anda...",
    contactPlaceholderEmail: "you@example.com",
    contactPlaceholderSubject: "Subjek pesan...",
    contactPlaceholderMessage: "Tuliskan pesan Anda di sini...",
    contactMessagesTitle: "PESAN YANG DITERIMA",
    contactNoMessages: "Belum ada pesan yang diterima. Kirimkan pesan di bawah!"
  },
  ja: {
    title: "知覚の年代記",
    subtitle: "GAME DEVELOPER, AI ENGINEER & TACTICAL DRONE ARCHITECT",
    beginJourney: "旅を始める",
    menuHome: "概要",
    menuTelemetry: "テレメトリ",
    menuSkills: "技術スキル",
    menuExperiences: "経験値",
    menuProjects: "プロジェクト",
    menuContact: "お問い合わせ",
    
    introTitle: "FIRZAL",
    introText: "アフマド・ダーラン大学の2年生。コンピュータビジョン、ゲーム開発、人工知能（AI）に深い関心を持っています。",
    introAbout: "自律飛行型航空アーキテクチャの設計、エッジコンピューティング環境へのニューラルネットワークモデルの実装、およびリアルタイムでの環境知覚のシミュレーション。ハードウェアアクチュエータと深層強化学習（RL）アルゴリズムの統合に焦点を当てています。",
    
    telemetryTitle: "KING PHOENIX パネル",
    telemetrySubtitle: "戦術ドローン制御パネル & AI認識システム",
    telemetryArmed: "有効",
    telemetryDisarmed: "無効",
    telemetryState: "ドローン・テレメトリ状態",
    telemetryAlt: "高度",
    telemetrySpeed: "速度",
    telemetryHeading: "方位 (HEADING)",
    telemetryPitch: "ピッチ",
    telemetryRoll: "ロール",
    telemetryYaw: "ヨー",
    telemetryControls: "手動オーバーライド",
    telemetryArmBtn: "モーター起動",
    telemetryDisarmBtn: "モーター停止",
    telemetryFlightMode: "飛行モード",
    telemetryPidTuning: "PID コントローラ調整",
    telemetryTerminalTitle: "ドローン・デバッグ端末",
    telemetryCameraTitle: "前面カメラ (YOLO認識)",
    telemetryCameraSub: "リアルタイムのオブジェクト検出とターゲット捕捉",
    telemetryYoloStatus: "YOLO認識マトリクス稼働中",
    telemetryLocalMap: "相対ターゲットローカルマップシステム",
    telemetryGateDist: "ターゲットへの距離",
    
    skillsTitle: "技術スキル",
    skillsSubtitle: "開発技術スタックと保有スキル",
    skillsCategoryLang: "プログラミング言語",
    skillsCategoryRobotics: "ロボット工学 & シミュレータ",
    skillsCategoryWeb: "フロントエンド & バックエンド",
    skillsCategoryDesign: "クリエイティブ & デザインツール",
    skillsCategoryHardware: "エッジシリコン & ハードウェア",
    skillsCategoryDatabase: "ストレージ & データベース",
    
    expTitle: "経験値アーカイブ",
    expSubtitle: "研究と自律開発の時系列記録",
    expGameDev: "ゲーム開発",
    expGameDevDesc: "Roblox StudioでLuau言語を使用した7年以上の特化型開発実績。物理演算に最適化されたマルチプレイヤー同期アーキテクチャ of 構築。GodotおよびUnityエンジンでのモダンなモジュール型ワークフロー設計スキルを保有。",
    expRoboticsDesc: "Webots、Gazebo、MuJoCoを用いた物理干渉シミュレーション。Stable Baselines 3 と Gymnasium 開発環境による自律ドローンの操縦モデル訓練。OpenCV、Mediapipe、およびYOLOバウンディングボックス/姿勢推定によるリアルタイム画像認識の実装。ROS Jazzyフレームワーク、MAVLink API、およびArduPilotファームウェアの実装。",
    expDockerDesc: "エッジコンピューティング環境向けに、シミュレーション環境、サービスバックエンド、およびデプロイサンドボックスを軽量なコンテナとしてDocker上にカプセル化。",
    
    projectsTitle: "配備セクター",
    projectsSubtitle: "稼働中のマルチプレイヤープロジェクト",
    projectResponseLondonRole: "コアゲームプレイ & システム開発リード",
    projectResponseLondonDesc: "現実の高度な都市スケール物理、緊密な戦術チームネットワーク、複雑な緊急支援救護プロトコルを忠実にシミュレートしたRobloxゲーム。",
    projectGasingBladeRole: "メインシステム設計 & 物理挙動エンジニア",
    projectGasingBladeDesc: "独自のLuau拘束条件、衝突判定ソルバー、高度なクライアント補間アルゴリズムを使用した、物理駆動型の極限競技用コマ対戦ゲーム。",
    visitProject: "シミュレーションを起動する",
    
    contactTitle: "お問い合わせ",
    contactSubtitle: "メッセージを送信",
    contactName: "お名前",
    contactEmail: "メールアドレス",
    contactSubject: "件名",
    contactMessage: "メッセージ",
    contactSendBtn: "メッセージ送信",
    contactSending: "送信中...",
    contactUplinkStatus: "安全な接続",
    contactSuccess: "メッセージが送信されました。ありがとうございます！",
    contactError: "メッセージの送信に失敗しました。もう一度お試しください。",
    contactPlaceholderName: "お名前を入力してください...",
    contactPlaceholderEmail: "you@example.com",
    contactPlaceholderSubject: "件名を入力してください...",
    contactPlaceholderMessage: "メッセージをここに書いてください...",
    contactMessagesTitle: "受信メッセージ一覧",
    contactNoMessages: "受信されたメッセージはありません。下のフォームから最初の信号を送信してください。"
  }
};
