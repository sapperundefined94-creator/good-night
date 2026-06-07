// ============================================
// 🌙 Good Night — Hand Tracker
// ============================================

/**
 * 手部跟踪辅助类
 *
 * 提供手部位置的平滑处理、速度计算等功能。
 */

export class HandTracker {
  constructor() {
    this.position = { x: 0, y: 0, z: 0 };
    this.prevPosition = { x: 0, y: 0, z: 0 };
    this.velocity = { x: 0, y: 0, z: 0 };
    this.smoothingFactor = 0.3;
    this.isPresent = false;
  }

  /** 更新手部位置（传入原始检测位置） */
  update(rawX, rawY, rawZ = 0) {
    this.prevPosition = { ...this.position };

    // 指数平滑
    this.position.x += (rawX - this.position.x) * this.smoothingFactor;
    this.position.y += (rawY - this.position.y) * this.smoothingFactor;
    this.position.z += (rawZ - this.position.z) * this.smoothingFactor;

    // 速度计算
    this.velocity.x = this.position.x - this.prevPosition.x;
    this.velocity.y = this.position.y - this.prevPosition.y;
    this.velocity.z = this.position.z - this.prevPosition.z;

    this.isPresent = true;
  }

  /** 手部丢失 */
  lost() {
    this.isPresent = false;
    this.velocity = { x: 0, y: 0, z: 0 };
  }

  /** 获取归一化位置 (0-1) */
  getNormalizedPosition() {
    return {
      x: this.position.x,
      y: this.position.y,
      z: this.position.z,
    };
  }

  /** 获取速度大小 */
  getSpeed() {
    return Math.sqrt(
      this.velocity.x ** 2 + this.velocity.y ** 2 + this.velocity.z ** 2
    );
  }
}
