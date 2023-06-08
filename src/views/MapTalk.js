import * as maptalks from "maptalks";
import "maptalks/dist/maptalks.css";
import EventHub from "./eventHub";
// import { ThreeLayer } from "maptalks.three";

export default class MapTalk {
  map = null;
  verticalLayer = null;
  drawTool = null;
  distanceTool = null;
  constructor(container) {
    this.init(container);
  }
  init(container) {
    this.map = new maptalks.Map(container, {
      center: [120.131259, 30.263295],
      zoom: 12,
      // baseLayer: new maptalks.TileLayer("base", {
      //  urlTemplate: "http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      //  subdomains: ["a", "b", "c"],
      // }),
      // baseLayer 表示基础图层，它可以添加多个,逗号隔开
      baseLayer: new maptalks.TileLayer("base", {
        // 电子地图图层
        urlTemplate:
          "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
        subdomains: ["a", "b", "c", "d"],
        attribution:
          '&copy; <a href="http://osm.org">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/">CARTO</a>',
      }),
      layers: [
        // 创建矢量图层：
        // new maptalks.VectorLayer('v', 几何图形列表(geometries), 可选参数配置(options))
        // 后续layer.addGeometry()可添加自定义几何图形、geoJSON图形等。
        new maptalks.VectorLayer("v", [
          new maptalks.Marker([120.131259, 30.263295]),
        ]),
      ],
    });
    this.verticalLayer = new maptalks.VectorLayer("l").addTo(this.map);

    this.addDrawToolbar();
    this.addDrawTool();
  }

  /**
   *增加绘制工具栏
   */
  addDrawToolbar(layer) {
    const _this = this;

    const items = [
      { code: "Point", name: "点" },
      { code: "LineString", name: "线" },
      { code: "Polygon", name: "几何面" },
      { code: "Circle", name: "圆" },
      { code: "Ellipse", name: "椭圆" },
      { code: "Rectangle", name: "矩形" },
      { code: "FreeHandLineString", name: "自由绘制" },
      { code: "FreeHandPolygon", name: "任意几何面" },
    ].map(function (value) {
      return {
        item: value.name,
        click: function () {
          _this.drawTool.setMode(value.code).enable();
        },
      };
    });
    new maptalks.control.Toolbar({
      position: {
        top: 100,
        right: 50,
      },
      items: [
        {
          item: "绘制矩形",
          click: function () {
            _this.drawTool.setMode("Rectangle").enable();
          },
        },
        {
          item: "禁用",
          click: function () {
            _this.drawTool.disable();
          },
        },
        {
          item: "清除",
          click: function () {
            _this.verticalLayer.clear();
          },
        },
      ],
    }).addTo(this.map);
  }

  addDrawTool() {
    const _this = this;
    this.drawTool = new maptalks.DrawTool({
      mode: "point",
      symbol: {
        lineColor: "#000",
        lineWidth: 5,
      },
      once: true,
    })
      .addTo(this.map)
      .disable();

    this.drawTool.on("drawend", function (param) {
      _this.verticalLayer.addGeometry(param.geometry);
      EventHub.emit("drawEnd", param.geometry._coordinates);
    });
  }

  clearLayer() {
    this.verticalLayer.clear();
  }
}
