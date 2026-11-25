// src/services/NegocioService.js

const Negocio = require('../models/Negocio');

class NegocioService {
  async createNegocio(data) {
    const negocio = new Negocio(data);
    await negocio.save();
    return negocio;
  }

  async getNegocios() {
    return await Negocio.find().sort({ nombre: 1 });
  }

  async getNegocio(id) {
    return await Negocio.findById(id);
  }

  async updateNegocio(id, data) {
    return await Negocio.findByIdAndUpdate(id, data, { returnDocument: 'after', runValidators: true });
  }

  async deleteNegocio(id) {
    return await Negocio.findByIdAndDelete(id);
  }
}

module.exports = new NegocioService();