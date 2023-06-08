import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

export default class Pipe {
  lineSet = [
    {
      start: [-50, -20, -10],
      stop: [50, -20, -10],
      color: "green",
    },
    {
      start: [0, 20, -20],
      stop: [30, 20, 50],
      color: "red",
    },
    {
      start: [-50, 20, 20],
      stop: [50, 20, 20],
      color: "blue",
    },
    {
      start: [-10, -20, -40],
      stop: [30, -20, 30],
      color: "yellow",
    },
  ];
  orbitControlState = false;
  orbitControlChangeState = false;
  select = {};
  camera = null;
  scene = null;
  renderer = null;
  pipeConfig = {
    spline: "Pipe",
    scale: 2,
    extrusionSegments: 100,
    radiusSegments: 10,
    closed: true,
    animationView: false,
    lookAhead: false,
    cameraHelper: false,
  };
  parent = null;
  controls = null;
  width = null;
  height = null;

  constructor(container) {
    this.init(container);
  }
  init(container) {
    container = document.getElementById(container);
    console.log("container: ", container.width, container.height);
    const { clientWidth, clientHeight } = container;

    this.width = clientWidth;
    this.height = clientHeight;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      this.width / this.height,
      0.01,
      10000
    );
    this.camera.position.set(0, 0, 200);
    this.camera.aspect = this.width / this.height;
    this.scene.add(this.camera);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
    });
    this.renderer.setSize(this.width, this.height);

    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true; // 开启控制器阻尼，动画效果更真实
    this.controls.minDistance = 100;
    this.controls.maxDistance = 2000;
    this.controls.addEventListener("start", this.startOrbitControlHandler);
    this.controls.addEventListener("end", this.endOrbitControlHandler);
    this.controls.addEventListener("change", this.changeOrbitControlHandler);

    const axesHelper = new THREE.AxesHelper(10);
    this.scene.add(axesHelper);

    this.parent = new THREE.Object3D();
    const splineCamera = new THREE.PerspectiveCamera(
      84,
      1000 / 800,
      0.01,
      1000
    );
    this.parent.add(splineCamera);
    this.scene.add(this.parent);

    const light = new THREE.AmbientLight(0xffffff); // soft white light
    this.scene.add(light);

    // const animate = () => {
    //   this.controls.update();
    //   requestAnimationFrame(animate);
    //   this.renderer.render(this.scene, this.camera);
    // };
    this.animate();

    this.loadSceneTexture();

    this.renderer.domElement.addEventListener("pointerup", this.handlePointUp);

    // 弹窗尺寸发生变化，需要更新相机投影矩阵，renderer的渲染宽高比。目前场景不需要
    // window.addEventListener("resize", () => {
    //   this.camera.aspect = this.width / this.height;
    //   this.camera.updateProjectionMatrix();
    //   this.renderer.setSize(this.width, this.height);
    //   this.renderer.setPixelRatio(window.devicePixelRatio);
    // });
  }

  handlePointUp = (event) => {
    if (
      !this.orbitControlState ||
      (this.orbitControlState && !this.orbitControlChangeState)
    ) {
      // 将控制器与模型点击事件区分
      let raycaster = new THREE.Raycaster();
      let intersections = [];
      // 获取鼠标屏幕坐标
      let rect = this.renderer.domElement.getBoundingClientRect();
      let mouse = new THREE.Vector2();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      // 通过相机角度和鼠标位置计算射线
      raycaster.setFromCamera(mouse, this.camera);
      // 获取射线相交模型，存储在数组intersections中
      raycaster.intersectObjects(this.scene.children, true, intersections);

      let selectedObject = null, // 被选中的模型
        origin = null; // 被选中的模型与射线的交点，用于确定挂牌位置

      if (intersections.length > 0) {
        // 存在与射线相交模型
        for (let i = 0; i < intersections.length; i++) {
          // 遍历与射线相交模型
          if (intersections[i].object instanceof THREE.Mesh) {
            // 取第一个（距离最近）的相交Mesh类型模型
            // 如果要排除地面等参照模型，也可在此处添加判断条件
            selectedObject = intersections[i].object;
            origin = intersections[i].point;
            break;
          }
        }
      }

      this.handleMeshClick(selectedObject, origin);
    }
    event.preventDefault();
  };

  handleMeshClick(object, origin) {
    console.log("meshClick: ", object);
    console.log("mesh origin: ", origin);
    let popupPosition = origin
      ? origin.clone().add(new THREE.Vector3(0, 20, 0))
      : null;
    let arrowPosition = origin
      ? origin.clone().add(new THREE.Vector3(0, 3, 0))
      : null;

    // 根据模型uuid判断此模型是否已经被选中
    if (
      this.select.object &&
      object &&
      this.select.object.uuid === object.uuid
    ) {
      // 如果模型已选中，直接更新挂牌位置
      this.select.sprite.position.set(
        popupPosition.x,
        popupPosition.y,
        popupPosition.z
      );
      this.select.arrow.position.set(
        arrowPosition.x,
        arrowPosition.y,
        arrowPosition.z
      );

      return;
    }
    if (this.select.object && this.select.originColor) {
      // 如果存在选中模型，先清除之前选中模型的样式
      this.select.object.material.color.set(this.select.originColor);
    }
    if (this.select.arrow) {
      // 如果存在挂牌箭头，先清除
      this.scene.remove(this.select.arrow);
      this.select.arrow = null;
    }
    if (this.select.sprite) {
      // 如果存在挂牌，先清除
      this.scene.remove(this.select.sprite);
      this.select.sprite = null;
    }

    // 清空已选中模型和模型原本颜色
    this.select.object = null;
    this.select.originColor = null;

    if (object) {
      // 如果传入选中的模型
      // 保存模型
      this.select.object = object;
      // 保存模型原色
      this.select.originColor = "#" + object.material.color.getHexString();
      // 设置选中模型颜色
      object.material.color.set(this.select.selectedColor);
      // 添加选中指示箭头
      this.select.arrow = new THREE.ArrowHelper(
        new THREE.Vector3(0, 1, 0),
        arrowPosition,
        15,
        this.select.originColor
      );
      this.scene.add(this.select.arrow);
      // 加载挂牌，传入挂牌文字和位置
      this.loadTextPopup(object.name, popupPosition);
    }
  }
  drawCanvas1(text) {
    let canvas = document.createElement("canvas"), // 画布
      ctx = canvas.getContext("2d"), // 画笔
      fontSize = 40, // 字体大小
      paddingv = 20, // 挂牌上下与文字距离
      paddingh = 30, // 挂牌左右与文字距离
      backgroundColor = "rgba(70, 160, 255, 1)", // 挂牌背景色
      fontColor = "white", // 挂牌文字颜色
      borderWidth = 5; // 挂牌背景描边宽度

    ctx.font = fontSize + "px Arial";
    // 测量文字在画布中的长度，用于计算画布尺寸
    let textWidth = Math.ceil(ctx.measureText(text).width),
      canvasWidth = textWidth + 2 * paddingh,
      canvasHeight = fontSize + 2 * paddingv;

    // 设置画布尺寸
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // 绘制一个形状
    let radius = 5 || Math.min(paddingv, paddingh);
    ctx.beginPath();
    ctx.lineWidth = borderWidth;
    ctx.strokeStyle = "blue";
    ctx.moveTo(paddingh + borderWidth, borderWidth);
    ctx.lineTo(canvasWidth - borderWidth - radius, borderWidth);
    // 右上拐角圆弧
    ctx.arcTo(
      canvasWidth - borderWidth,
      borderWidth,
      canvasWidth - borderWidth,
      borderWidth + radius,
      radius
    );
    ctx.lineTo(canvasWidth - borderWidth, canvasHeight - borderWidth - radius);
    // 右下拐角圆弧
    ctx.arcTo(
      canvasWidth - borderWidth,
      canvasHeight - borderWidth,
      canvasWidth - borderWidth - radius,
      canvasHeight - borderWidth,
      radius
    );
    ctx.lineTo(borderWidth + radius, canvasHeight - borderWidth);
    // 左下拐角圆弧
    ctx.arcTo(
      borderWidth,
      canvasHeight - borderWidth,
      borderWidth,
      canvasHeight - borderWidth - radius,
      radius
    );
    ctx.lineTo(borderWidth, paddingv + borderWidth);
    ctx.closePath();
    ctx.stroke();
    ctx.clip();

    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = fontColor;
    ctx.font = fontSize + "px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    return canvas;
  }

  loadTextPopup(text, position) {
    // 生成挂牌贴图
    let canvas = this.drawCanvas1(text);

    // 设置纹理
    let texture = new THREE.Texture(canvas);
    // 设置纹理属性，便于展示
    texture.needsUpdate = true;
    // 设置材质
    const material = new THREE.SpriteMaterial({
      map: texture,
      color: 0xffffff,
    });
    // 设置材质透明度
    material.opacity = 0.8;
    // 设置挂牌
    this.select.sprite = new THREE.Sprite(material);
    // 设置挂牌位置
    this.select.sprite.position.set(position.x, position.y, position.z);
    // 根据挂牌贴图尺寸比例初始化挂牌尺寸
    this.select.sprite.scale.set((10 / canvas.height) * canvas.width, 10, 1);
    // 添加挂牌
    this.scene.add(this.select.sprite);
  }

  animate = () => {
    this.controls.update();
    requestAnimationFrame(this.animate);
    this.renderer.render(this.scene, this.camera);
  };

  add() {
    this.lineSet.forEach((line) => {
      const { start, stop, color } = line;
      const path = new THREE.LineCurve(
        new THREE.Vector3(...start),
        new THREE.Vector3(...stop)
      );
      const material = new THREE.MeshLambertMaterial({ color });
      const lineGeometry = new THREE.TubeGeometry(
        path,
        this.pipeConfig.extrusionSegments,
        2,
        this.pipeConfig.radiusSegments,
        this.pipeConfig.closed
      );

      const tubeMesh = new THREE.Mesh(lineGeometry, material);
      tubeMesh.name = color + " pipe";
      // const wireframe = new THREE.Mesh(lineGeometry, wireframeMaterial);
      // tubeMesh.add(wireframe);
      this.parent.add(tubeMesh);
      tubeMesh.scale.set(
        this.pipeConfig.scale,
        this.pipeConfig.scale,
        this.pipeConfig.scale
      );
    });
  }

  loadSceneTexture() {
    const textureCubeLoader = new THREE.CubeTextureLoader().setPath(
      "./textures/"
    );
    const textureCube = textureCubeLoader.load([
      "1.jpg",
      "2.jpg",
      "3.jpg",
      "4.jpg",
      "5.jpg",
      "6.jpg",
    ]);
    this.scene.background = textureCube;
    this.scene.environment = textureCube;
  }
  startOrbitControlHandler(evt) {
    this.orbitControlState = true;
  }
  endOrbitControlHandler(evt) {
    this.orbitControlState = false;
    this.orbitControlChangeState = false;
  }
  changeOrbitControlHandler(evt) {
    this.orbitControlChangeState = true;
  }
}
