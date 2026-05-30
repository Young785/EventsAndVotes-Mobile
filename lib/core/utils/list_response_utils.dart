/// Parses paginated list API responses (`data` + `meta` or `pagination`).
Map<String, dynamic> parsePaginatedResponse(dynamic body) {
  if (body is! Map) {
    return {'data': <dynamic>[], 'meta': <String, dynamic>{}};
  }
  final map = Map<String, dynamic>.from(body);
  final nested = map['data'];

  Map<String, dynamic> metaFrom(Map<String, dynamic> source) {
    if (source['meta'] is Map) {
      return Map<String, dynamic>.from(source['meta'] as Map);
    }
    if (source['pagination'] is Map) {
      return Map<String, dynamic>.from(source['pagination'] as Map);
    }
    return <String, dynamic>{};
  }

  if (nested is Map && nested['data'] is List) {
    final nestedMap = Map<String, dynamic>.from(nested);
    return {
      'data': nested['data'] as List,
      'meta': metaFrom(nestedMap).isNotEmpty ? metaFrom(nestedMap) : metaFrom(map),
    };
  }
  if (nested is List) {
    return {'data': nested, 'meta': metaFrom(map)};
  }
  return {'data': <dynamic>[], 'meta': metaFrom(map)};
}

List<Map<String, dynamic>> parseListItems(List? raw) {
  if (raw == null) return [];
  return raw
      .whereType<Map>()
      .map((e) => Map<String, dynamic>.from(e))
      .toList();
}
