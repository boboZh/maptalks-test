import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";

const router = createRouter({
 history: createWebHistory(import.meta.env.BASE_URL),
 routes: [
  {
   path: "/",
   name: "home",
   component: HomeView,
  },
  {
   path: "/demo1",
   name: "demo1",
   component: () => import("../views/demo1.vue"),
  },
 ],
});

export default router;
