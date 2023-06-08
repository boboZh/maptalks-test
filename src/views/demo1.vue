<template>
  <div class="root-container">
    <div class="map-container" id="mapContainer"></div>
    <div class="popup" id="threeContainer" ref="popupRef">
      <div class="closeBtn" @click="exit">退出</div>
    </div>
  </div>
</template>
<script>
import { ref, onMounted } from "vue";
import MapTalk from "./MapTalk";
import EventHub from "./eventHub";
import Pipe from "./pipe";

export default {
  name: "MapContainer",
  setup() {
    const map = ref(null);
    const pipeObj = ref(null);
    const popupRef = ref(null);

    EventHub.on("drawEnd", (vertex) => {
      console.log("四个顶点坐标：", vertex);
      console.log("popupRef: ", popupRef.value);
      popupRef.value.style.top = "50%";
      pipeObj.value = new Pipe("threeContainer");
      pipeObj.value.add();
    });

    const exit = () => {
      popupRef.value.style.top = "-50%";
      map.value.clearLayer();
    };

    onMounted(() => {
      map.value = new MapTalk("mapContainer");
    });
    return {
      popupRef,
      exit,
    };
  },
};
</script>

<style scoped>
.root-container {
  position: relative;
  width: 100%;
  height: 100%;
}
.map-container {
  width: 100%;
  height: 100%;
}
.popup {
  position: absolute;
  width: 60%;
  height: 70%;
  z-index: 3;
  border: 1px solid rgb(113, 132, 247);
  box-shadow: 5px rgb(113, 132, 247);
  border-radius: 20px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  top: -50%;
  transition: top 0.2s ease;
}
.closeBtn {
  position: absolute;
  padding: 0 20px;
  height: 24px;
  line-height: 24px;
  border: 1px solid rgb(113, 132, 247);
  display: block;
  box-sizing: border-box;
  top: -30px;
  right: 0;
  cursor: pointer;
  background: white;
  color: rgb(85, 110, 246);
}
</style>
