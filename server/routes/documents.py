"""Driver document upload routes."""

from flask import Blueprint, request, jsonify, current_app, g


from models.driver import (
    DOCUMENT_TYPES, upload_document, find_driver_by_id, serialize_driver
)
from middleware.auth import driver_required

documents_bp = Blueprint('documents', __name__)


@documents_bp.route('/<doc_type>', methods=['POST'])
@driver_required
def upload_doc(doc_type):
    """Driver uploads a base64-encoded document."""
    if doc_type not in DOCUMENT_TYPES:
        return jsonify({'error': f'Invalid document type. Must be one of: {", ".join(DOCUMENT_TYPES)}'}), 400

    data = request.get_json()
    if not data or not data.get('data'):
        return jsonify({'error': 'Base64 document data is required in the "data" field'}), 400

    b64 = data['data']
    # Basic size sanity check: base64 of 10 MB ≈ 13.3 M chars
    if len(b64) > 14_000_000:
        return jsonify({'error': 'File too large. Maximum size is 10 MB.'}), 413

    db = current_app.config['db']
    upload_document(db, g.current_user['id'], doc_type, b64)

    driver = find_driver_by_id(db, g.current_user['id'])
    return jsonify({
        'message': f'{doc_type} uploaded successfully. Pending admin review.',
        'driver': serialize_driver(driver, include_documents=True),
    }), 200


@documents_bp.route('', methods=['GET'])
@driver_required
def get_docs():
    """Driver retrieves their own document upload statuses (no base64 data)."""
    db = current_app.config['db']
    driver = find_driver_by_id(db, g.current_user['id'])
    if not driver:
        return jsonify({'error': 'Driver not found'}), 404
    return jsonify({
        'driver': serialize_driver(driver, include_documents=True),
    }), 200
